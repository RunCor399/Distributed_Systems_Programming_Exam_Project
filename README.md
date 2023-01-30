# Exam Call 1, Film Library
*Author: Colotti Manuel Enrique, s297014*


## **Design**
In this sections will be explained the main design choices adopted for the development of this exam assignment
### **Starting Point**
As a starting point of the Design and Implementation I have decided to use the solutions from Laboratory 1 that already implemented the main functionalities of the Film Library Service.
In this scenario we will have the following main components:

- **index.js**: Entry point of the system that among the other functionalities expresses the various REST API endpoints
- **Controllers**: When an endpoint is called, the latter will in turn invoke a method inside one of the specific controllers. The controller will then be in charge of forwarding the received request to the proper service and return a response.
- **Services**: implement the logic of the system by performing CRUD operations on the database and returning a response to the Controllers when finished.
- **Components**: represent the objects modeled in this system. Instances of various components are created by Services and returned in responses' bodies to clients.


### **New REST APIs**
The assignment requested to *introduce the possibility to have reviews that must be completed
by more than one user in a cooperative way*.

Users that are assigned a cooperative review will now have the possibility of creating a Review Draft, which essentialy represents a temporary review for a specific film.

The other reviewers can either agree or disagree on a specific draft review by casting a vote;

- **If all users agree on a specific draft**, the latter will become the final review and the draft will be closed. 
  
- **If at least one user disagrees and all the reviewers have voted**, the draft will be closed and a new one may be opened.

To model the previously explained functionalities, I've first extended the REST API Design by introducing this 4 endpoints:

1. **GET /api/films/public/:filmId/reviews/:reviewId/drafts** <br> Retrieve all the Review Drafts that were created for a specific review.
   
2. **POST /api/films/public/:filmId/reviews/:reviewId/drafts/** <br> Create a new Review Draft for a specific review
    
3. **GET /api/films/public/:filmId/reviews/:reviewId/drafts/:draftId** <br> Retrieve information on a single Review Draft of a specific review.
   
4. **PUT /api/films/public/:filmId/reviews/:reviewId/drafts/:draftId** <br> Vote for a single Review Draft belonging to a specific review.


### **Database Extension Design**
Once defined the new API endpoints, I started enhancing the initial database design in order to implement the requested functionalities.

**In particular**: 

- Three new Tables have been created to model: **Drafts**, **Reviewers** and **Votes**
- **Reviews** Table primary key is no longer a combination of **reviewerId** and **filmId**, but a new field named **reviewId**.
- **Drafts** Table, among other fields, will reference with a foreign key the **Review** for which it was created and the **User** that created it.
- **Reviewers** Table only contains two columns: <br>
    1. **reviewId** that references an entry in **Reviews** Table.
    2. **userId** that references an entry in **Users** Table.

- **Votes** Table will have two foreign keys that reference a **Draft** for which this vote has been casted and the **User** that expressed this vote.

For additional clarity, the following image shows the overall design of the Database: 
<br>
<br>
<br>
![Enhanced Database Design](./REST%20APIs%20Design/images/db_design.PNG)
<br>
<br>
<br>

### **OpenAPI & JSON Schemas**
To implement **HATEOAS** principles and model the new components of the system, I've redefined all JSON Schemas related to already existing concepts and added new JSON Schemas specifically targeted at new components.

The approach I've used was quite verbose, as a matter of fact I decided to create for each specific endpoint that included either a Request or a Response body, a specific JSON Schema that exactly mirrors the actual data that will be transported both in requests and responses.

All these schemas can be found in the **JSON Schemas** directory and also embedded inside the **OpenAPI Documentation** which can be found in **./REST APIs Design/openapi.yaml**.



    

## **Implementation**
In this section i will briefly talk about how the new requested functionalities were implemented.

### **Single Reviews Logic**
Before starting implementing Cooperative Reviews I've also modified the way Single Reviews can be issued. As a matter of fact in my implementation this type of review invitation can be issued to multiple users at the same time.

To do so it's possible to specify in the body a list of **reviewers** by which the invitation should be received. I chose this implementation to give an alternative to issuing *N* single review invitations followed by *N* HTTP Requests from the client.

### **Cooperative Reviews Logic**
Cooperative reviews can be issued as such specifying a body parameter named **review_type** which can assume only the values **single** or **coop** (cooperative). 

This choice has been taken because I've decided to keep only one single endpoint for issuing review invitations; i didn't deem necessary to split them as I figured out that I could distinguish between the kind of review by using **review_type** body parameter.

In addition to the constraints expressed in the Exam assignment, I've added a simple rule that models the situation in which a film owner is trying to issue a cooperative review to only one user (that could also be himself). 
In the just explained scenario, the review is automatically downgraded to a **single** one as it seemed to me that this situation was going against the semantics of the word **cooperative**.

Furthermore having **cooperative** reviews issued to single users would have allowed users to perform multiple **single** reviews for the same film, which as stated in the requirements is not allowed. 

### **Consistency Checks**
For each of the new functionalities I have implemented many consistency checks that are essential for the proper functioning of the system. 

Here i will list the ones related to the main functionalities: 

#### **Issue a Single Review Invitation**
1. Check that all reviewers exist
2. Check for each user if they have already been assigned to review this film

A particularity about the second check is that if one or more of the users have already been assigned to review this film, the check will fail but the procedure will carry on by only issuing the review invitation to the eligible users. This is the default behaviour unless all the specified reviewers have already been assigned to review this film. 

#### **Issue a Cooperative Review Invitation**

1. Check that all reviewers exist.

#### **Create a Review Draft**
1. Check that the film exists
2. Check that the review exists
3. Check that the user is among the reviewers of this specific review
4. Check that the review is cooperative
5. Check that the review draft is open
   
#### **Vote a Review Draft**
1. Check that the film exists
2. Check that the review exists
3. Check that the user is among the reviewers of this specific review
4. Check that the draft is open
5. Check that the user didn't already cast his vote for this draft

At the end of these checks a vote will be inserted in the Database and in case all reviewers 
have expressed their vote for this draft, the latter and eventually the review to which it refers, will be updated accordingly.

   
### **Error Code Logic**
To present users specific error messages depending on what went wrong, I've implemented my own logic for error management specified in **UtilFunctions.js** file inside **service** directory.

Inside this file i've specified a dictionary that matches response status codes to different error messages. In this way i was able to define for one single status code many possible outcomes:

Extract of the error messages associated to their code:

    ...
    {id:"409a", code:409, message:"This film cannot be updated"},
    {id:"409b", code:409, message:"You are not a reviewer of this specific review"},
    {id:"409c", code:409, message:"Cooperative review invitationbe send"},
    {id:"409d", code:409, message:"Single review invitation cosend"},
    {id:"409e", code:409, message:"One or more of the reviewerexist"},
    {id:"409f", code:409, message:"This film doesn't exist"},
    {id:"409g", code:409, message:"This review doesn't exist"},
    {id:"409h", code:409, message:"This review isn't cooperative already been completed"},
    {id:"409i", code:409, message:"There is a draft already open for this review"},
    {id:"409j", code:409, message:"This draft doesn't exist already been closed"},
    {id:"409k", code:409, message:"You have already voted for this draft"},
    {id:"409l", code:409, message:"This review is not cooperative"},
    ...

A specific function will then pass a whole object of this dictionary to the Controller that will be in charge of returning a response to the client.

## **Test**
### **Postman Collection**
Inside **./REST APIs Design/postman** directory I've included a Postman Collection that includes all the APIs of the application and some additional test cases that can be manually executed to check some of the most important features of the system.

 I've left URL parameters of each call empty so that they can be freely defined, on the other hand body parameters of requests have already be defined according to the JSON Schemas.

### **Database Files**
Inside **./database** directory it is possible to find three distinct files:
1. **databaseV1.db**: the SQLite Database file
   
2. **table_creation.sql**: Queries used to create the final design of the Database, *Users* and *Films* Tables are not included in this file as their schema wasn't modified at all.

3. **insert_data_queries.sql**: INSERT queries used to populate *Films*, *Reviews* and *Reviewers* Tables; *Drafts* and *Votes* Tables have been populated using Postman with some test Requests, *User* Table is the same as the one of Laboratory 1
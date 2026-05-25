Greetings, gentlemen!

Date: 1st January 1500

**Overview**

We walk through the 
1. General setup of our folders
2. Running instructions
3. What to do when getting an error

----

In order to run the drawing input system, you first need to realise
that we have 2 main folders - client and server.

Both the client instance AND the server instance need to be started in order
for our application to work.

In order to do that, you must be inside the drawing-input directory

----

**Setup Instructions**

NOTE: for setup instructs neccessary to incl. setup and installation guides since npm init is not acknowledged. command 'npm run install-all
' works.

1. Type "cd drawing-input"

2. Then type "npm run dev"

- You will receive a link to port 5137 and you should click that link, which will take you to the GarticHands webcam + MediaPipe system. 
- You will also receive a message showing "Server is running on Port 3000". 
- You won't receive a link to the server but if you
do want to check, you can go to http://localhost/3000 and you will see the message "Server is running".

**In case of ERRORS**

**If you get an error** in your terminal after starting client and server ports with the error code **"EADDRINUSE"**, then that means you have a virus on your computer. Just kidding. This error means that the server **instance you are trying to access is already running from a previous run** and has not been shut down yet. To shut it down, you need to follow a 2 step process:

1. Type "lsof -i: [insert port number]". The port number in question is the port number you will receive alongside the error code "EADDRINUSE". 

The meaning of this command is that you check the status of the instance running at the port in question. When you get output, take note of the PID (process ID) of the instance. You will need this for step #2

2. Type: "kill -9 [PID shown in step #1]". This will stop the server instance from running.

Now you are free to go ahead to cd drawing-input and run our application with "npm run dev"
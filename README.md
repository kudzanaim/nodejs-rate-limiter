# Description
This is a Node JS API created for the purpose of showcasing how rate limiting can be implemented to manage incoming traffic/and load for all API endpoints. 
- the rate limiter uses an internal queue (queue = {}) to keep track of all requests. When a request is received, we save the clients IP address in the "queue" object alongside with the "timestamp" of the first request made by the client. Upon subsequent requests we check if the requesting IP has been stored in memory, if so we increment the counyt of requests made by one. Only 10 requests can be made within a 30 second window. If the max requests is reached, client will receive a 503 status alerting them to wait for 10 sec before making another request.

# Technology Used
- Docker to create a build we can deploy to Google Cloud Build
- Postgress for the Database and joins
- Cloud Run to deploy our contanirized application as a serverless app
- Git Hub & Cloud Triggers, to implement CI/CD workflow. Each time we make a commit, Google Cloud Run will trigger docker to build our new updates and deploy it.
- Cloud Run for load balancing.

# Demo
You can access the API directly in the browser [here](https://work-gcsusetqgq-uk.a.run.app/poi), 

# Routes
- /poi
- /events/hourly
- /stats/daily
- /events/daily'
- /poi





const express = require('express')
const pg = require('pg')
const cors = require('cors')
const requestIp = require('request-ip');
require('dotenv').config()

const app = express()
const pool = new pg.Pool()

// Set Cors:
app.use(cors())

// Controls:
const queue = {};
const maxRequests = 10;
const refreshTime = 10000;
const requestWindow = 30000; //milliseconds::

const queryHandler = (req, res, next) => {
  pool.query(req.sqlQuery).then((r) => {
    return res.json(r.rows || [])
  }).catch(next)
};

const ratelimiter = (req, res, next)=>{

  // Client Response::
  const success = ()=>{
    (req.path=='/')? res.send('Welcome to EQ Works 😎: Version 2.0') : queryHandler(req, res, next);
  };
  // Save first connection:
  if(queue[requestIp.getClientIp(req) ] ){
    let count = queue[ requestIp.getClientIp(req) ]['count'] + 1;
    let timeSinceLastRequest = new Date().getTime() - queue[ requestIp.getClientIp(req)]['firstRequest'] ;
    // If MaxRequests Reached in 1minute Reject Request:
    if( count>=maxRequests && timeSinceLastRequest >= requestWindow){
      res.status(503).send('You have reached maximum requests. Please try again in 10 seconds'); 
      // Delete Client Request after 30 sec
      setTimeout(function(){
        delete queue[ requestIp.getClientIp(req) ];
      }, refreshTime)
    }
    // Update Client Request Counter:
    else{
      queue[ requestIp.getClientIp(req) ]['count'] = count;
      queue[ requestIp.getClientIp(req) ]['timeSinceLastRequest'] = timeSinceLastRequest;
      success()
    }
  }
  // Create Client Record:
  else{
    queue[ requestIp.getClientIp(req) ] = ({firstRequest: new Date().getTime(), count:1});
    success()
  };

}

app.get('/', (req, res, next) => {
  return next()
}, ratelimiter)

app.get('/events/hourly', (req, res, next) => {
  req.sqlQuery = `
    SELECT *
    FROM public.hourly_events events
    
    INNER JOIN poi ON
    events.poi_id = poi.poi_id

    ORDER BY date, hour

    LIMIT 168;
  `
  return next()
}, ratelimiter)

app.get('/events/daily', (req, res, next) => {
  req.sqlQuery = `
    SELECT date, SUM(events) AS events
    FROM public.hourly_events
    GROUP BY date
    ORDER BY date
    LIMIT 7;
  `
  return next()
}, ratelimiter)

app.get('/stats/hourly', (req, res, next) => {
  req.sqlQuery = `
    SELECT *
    FROM public.hourly_stats hourly

    INNER JOIN poi ON
    hourly.poi_id = poi.poi_id

    ORDER BY date, hour

    LIMIT 168;
  `
  return next()
}, ratelimiter)

app.get('/stats/daily', (req, res, next) => {
  req.sqlQuery = `
    SELECT *
    FROM public.hourly_stats hourly
    
    INNER JOIN poi ON
    hourly.poi_id = poi.poi_id
    LIMIT 20;
  `
  return next()
}, ratelimiter)

app.get('/poi', (req, res, next) => {
  req.sqlQuery = `
    SELECT

    SUM(clicks) AS clicks,
    SUM(impressions) AS impressions,
    SUM(revenue) AS revenue,
    name

    FROM public.poi point

    INNER JOIN hourly_stats ON
    point.poi_id = hourly_stats.poi_id

    GROUP BY name
  `
  return next()
}, ratelimiter)

app.listen(process.env.PORT || 5555, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  } else {
    console.log(`Running on ${process.env.PORT || 5555}`)
  }
})

// last resorts
process.on('uncaughtException', (err) => {
  console.log(`Caught exception: ${err}`)
  process.exit(1)
})
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
  process.exit(1)
})

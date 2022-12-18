const express = require('express');
const app = express();
const pool = require('./connection');
const PORT = 3000;

app.set("view engine", "ejs");
app.set("views", "./view")

const bodyParser = require("body-parser")
  
// New app using express module

app.use(bodyParser.urlencoded({
    extended:true
}));


app.get('/',(req,res)=>{
    let qry = "select gid from mouza_map_drone";
    
    pool.query(qry, (err, results) => {
        if (err) throw err
        else {
            //res.send(results.rows);
            res.render('index',{plotList:results.rows});
        }

    });
});
app.get('/searchplot',(req,res)=>{
    const gid = req.query.plotNo;
    console.log(gid);
    let query = "select ST_AsGeoJSON(geom) from mouza_map_drone where gid = $1";
    pool.query(query,[gid],(err,results)=>{
        if(err)throw err;
        var geojson = results.rows[0].st_asgeojson;
        //res.send(geojson);
        res.render('map',{plotInfo:geojson});
    })
    
});

app.post('/addnew-plot',(req,res)=>{
   
    const {gid,oid_,name,symbolid,area_h,geom} = req.body;
    console.log(req.body);
    let qry = "insert into mouza_map_drone(oid_,name,symbolid,area_h,geom) values($1,$2,$3,$4,$5)";
    pool.query(qry, [oid_,name,symbolid,area_h,geom], (err, results) => {
        if(err)throw err; 
        else  res.send("Data inserted Successfully");
    })
})  





app.listen(PORT,()=>{
    console.log(`PORT is listen on ${PORT}`);
})

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
    let qry = "select plot_no_en from borolekh order by plot_no_en asc";
    pool.query(qry, (err, results) => {
        if (err) throw err
        else {
            res.render('index',{plotList:results.rows});
        }
    });
});
app.get('/searchplot',(req,res)=>{
    const plot_no_en = req.query.plotNo;
    console.log(plot_no_en);
    //let query = "SELECT ST_AsGeoJSON(ST_Transform(ST_SetSRID(geom, 3400), 4326)) FROM borolekh where plot_no_en = $1;"
    let query = "SELECT ST_AsGeoJson(geom) FROM borolekh Where plot_no_en = $1";
    pool.query(query,[plot_no_en],(err,results)=>{
        if(err)throw err;
        var geojson = results.rows[0].st_asgeojson;
        //res.send(geojson);
        res.render('display_plot',{plotInfo:geojson});
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

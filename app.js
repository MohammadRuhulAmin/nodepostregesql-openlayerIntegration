const express = require('express');
const app = express();
const pool = require('./connection');
const PORT = 3000;

app.set("view engine", "ejs");
app.set("views", "./view")
app.use(express.static(__dirname + "/public"))

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





app.listen(PORT,()=>{
    console.log(`PORT is listen on ${PORT}`);
})

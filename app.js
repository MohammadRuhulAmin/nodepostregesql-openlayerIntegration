const express = require('express');
const app = express();
const pool = require('./connection');
const PORT = 3000;

app.set("view engine", "ejs");
app.set("views", "./view")


app.get('/',(req,res)=>{
    let qry = "select plot_no_en from borolekh ORDER BY plot_no_en asc";
    pool.query(qry, (err, results) => {
        if (err) throw err
        else {
            res.render('index',{plotList:results.rows});
        }

    });
});
app.get('/searchplot',(req,res)=>{
    res.render('map');
    // const plotNo = req.query.plotNo;
    // let query = "SELECT ST_AsGeoJson(geom) FROM borolekh WHERE plot_no_en = $1";
    // pool.query(query,[plotNo],(err,results)=>{
    //     if(err)throw err;
    //     res.send(results.rows);
    // })
});




app.listen(PORT,()=>{
    console.log(`PORT is listen on ${PORT}`);
})

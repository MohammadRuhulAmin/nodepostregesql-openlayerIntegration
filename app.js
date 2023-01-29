const express = require('express');
const http = require('http');
const url = require('url');
const app = express();
const pool = require('./connection');
const PORT = 3000;
const turf = require('@turf/turf');
app.set("view engine", "ejs");
app.set("views", "./view")
app.use(express.static(__dirname + "/public"))
const bodyParser = require("body-parser")
  


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
    //var geoJson,stArea,stleng,details;
    let query1 = "SELECT ST_AsGeoJson(ST_Simplify(geom,2)) FROM borolekh Where plot_no_en = $1";
    let query2 = "SELECT shape_area FROM borolekh WHERE plot_no_en = $1";
    let query3 = "SELECT shape_leng FROM borolekh WHERE plot_no_en = $1";
    let query4 = "SELECT * FROM borolekh WHERE plot_no_en = $1";
    pool.query(query4,[plot_no_en],(err,result)=>{
        if(err)throw err;
        else{
            var details = result.rows[0];
            pool.query(query3,[plot_no_en],(err,result)=>{
                var queryPlot = plot_no_en;
                if(err)throw err;
                else{
                    var stleng= result.rows[0];
                    pool.query(query2,[plot_no_en],(err,result)=>{
                        if(err)throw err;
                        else{ 
                           var  stArea = result.rows[0];
                           pool.query(query1,[plot_no_en],(err,results)=>{
                            if(err)throw err;
                            geoJson = results.rows[0].st_asgeojson; 
                            var sArea = parseFloat(stArea.shape_area)*0.00002295684113;
                            sArea = sArea.toFixed(4);
                            var sLength = parseFloat(stleng.shape_leng)*3.28084 ;
                            
                            
                            
                            if(details.archrive_plot == 'y'){
                               
                                let qryc1 = "SELECT ST_AsGeoJSON(geom) FROM borolekh Where plot_no_en = $1";
                                    pool.query(qryc1,[queryPlot],(err,results)=>{
                                        if(err)throw err;
                                        else{
                                            var parentChildGeoJsonList = [];
                                            var parentPlotGeoJson = results.rows[0];
                                            parentChildGeoJsonList.push(parentPlotGeoJson.st_asgeojson);
                                           // res.send(parentChildGeoJsonList)
                                            let qryc2 = "SELECT ST_AsGeoJSON(geom) FROM borolekh Where parent_plot = $1";
                                            pool.query(qryc2,[queryPlot],(err,results)=>{
                                                if(err)throw err;
                                                else{
                                                    var childPlotsGeoJson = results.rows;
                                                    for(let i = 0;i<childPlotsGeoJson.length;i++){
                                                        parentChildGeoJsonList.push(childPlotsGeoJson[i].st_asgeojson)
                                                    }
                                                    let qryc3 = "select plot_no_en from borolekh where parent_plot = $1";
                                                    pool.query(qryc3,[queryPlot],(err,results)=>{
                                                        if(err)throw err;
                                                        else{
                                                            let plotsList = results.rows;
                                                            var plotIdList = {
                                                                plotId0 : queryPlot,
                                                                plotId1 : plotsList[0].plot_no_en,
                                                                plotId2 : plotsList[1].plot_no_en 
                                                            }
                                                            res.render('parentAndChildPlot',{parentChildPlotGeoList:JSON.stringify(parentChildGeoJsonList),plotIdList:JSON.stringify(plotIdList)});
                                                            
                                                        }
                                                    })
                                                   
                                                }
                                            })
                                        }
                                    });
                              
                               
                            }
                            else{
                                res.render('map',
                                {
                                    plotId:plot_no_en,
                                    plotInfo:geoJson,
                                    plotArea:stArea.shape_area,
                                    plotLeng:stleng.shape_leng,
                                    district :details.m_dist_en,
                                    subDistrict:details.m_name_en,
                                    jlNo:details.jl_no_en,
                                    plotNo:details.plot_no_en,
                                    parent_plot:details.parent_plot
                                   
                                    
                                });
                            }
                          
                        });
                        }
                        
                    });
                }
                
            });
        }
        
    });
   
    

    

    
  
    
});

app.post('/savePlot', (req,res)=>{
    const {spGeoJson_1,spGeoJson_2,plotId,sp_area_1,sp_area_2,sp_arm_1,sp_arm_2} = req.body;  
    let qry1 = "SELECT ST_GeomFromGeoJSON($1)";
    pool.query(qry1,[spGeoJson_1],(err,result)=>{
        if(err)throw err;
        else{
            var geom1 = result.rows[0];
            pool.query(qry1,[spGeoJson_2],(err,result)=>{
                if(err)throw err;
                else{
                    var geom2 = result.rows[0];
                    
                    let qry2 = "SELECT * FROM borolekh WHERE plot_no_en = $1";
                    pool.query(qry2,[plotId],(err,result)=>{
                        if(err)throw err;
                        else{
                            var pd = result.rows[0];
                            let qry3 = "SELECT plot_no_en from borolekh order by plot_no_en desc limit 1";
                            pool.query(qry3,(err,result)=>{
                                if(err) throw err;
                                else {
                                    var lastPlotId = result.rows[0].plot_no_en;
                                    let qry6 = "SELECT ST_Area($1)";
                                    pool.query(qry6,[geom1.st_geomfromgeojson],(err,result)=>{
                                        if(err)throw err;
                                        else{
                                            var geom1Area = result.rows[0];
                                            pool.query(qry6,[geom2.st_geomfromgeojson],(err,result)=>{
                                                if(err)throw err;
                                                else {
                                                    var geom2Area = result.rows[0];
                                                    let qry7 = "SELECT ST_Length( ST_boundary($1))";
                                                    pool.query(qry7,[geom1.st_geomfromgeojson],(err,result)=>{
                                                        if(err) throw err;
                                                        else {
                                                            var geom1Length = result.rows[0];
                                                            pool.query(qry7,[geom2.st_geomfromgeojson],(err,result)=>{
                                                                if(err)throw err;
                                                                else {
                                                                    var geom2Length = result.rows[0];
                                                                    console.log(geom2Length);
                                                                    let qry4 =  "INSERT INTO borolekh(pj_name_en,pj_name_bn,m_code,m_div_en,m_div_bn,m_dist_en,m_dist_bn,m_thana_en,m_thana_bn,m_name_en,m_name_bn,jl_no_en,jl_no_bn,sht_no_en,sht_no_bn,l_code_en,l_code_bn,l_name_en,l_name_bn,plot_no_en,plot_no_bn,sv_type_en,sv_type_bn,scale_en,scale_bn,sv_year_en,sv_year_bn,rev_no_en,rev_no_bn,geocode_en,remarks,filename,shape_leng,shape_area,geom,parent_plot) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36)";
                                                                    pool.query(qry4,[pd.pj_name_en,pd.pj_name_bn,pd.m_code,pd.m_div_en,pd.m_div_bn,pd.m_dist_en,pd.m_dist_bn,pd.m_thana_en,pd.m_thana_bn,pd.m_name_en,pd.m_name_bn,pd.jl_no_en,pd.jl_no_bn,pd.sht_no_en,pd.sht_no_bn,pd.l_code_en,pd.l_code_bn,pd.l_name_en,pd.l_name_bn,lastPlotId+1,lastPlotId+1,pd.sv_type_en,pd.sv_type_bn,pd.scale_en,pd.scale_bn,pd.sv_year_en,pd.sv_year_bn,pd.rev_no_en,pd.rev_no_bn,pd.geocode_en,pd.remarks,pd.filename,geom1Length.st_length,geom1Area.st_area,geom1.st_geomfromgeojson,pd.plot_no_en],(err,result)=>{
                                                                             if(err)throw err;
                                                                             else{
                                                                                
                                                                                let qry5 =  "INSERT INTO borolekh(pj_name_en,pj_name_bn,m_code,m_div_en,m_div_bn,m_dist_en,m_dist_bn,m_thana_en,m_thana_bn,m_name_en,m_name_bn,jl_no_en,jl_no_bn,sht_no_en,sht_no_bn,l_code_en,l_code_bn,l_name_en,l_name_bn,plot_no_en,plot_no_bn,sv_type_en,sv_type_bn,scale_en,scale_bn,sv_year_en,sv_year_bn,rev_no_en,rev_no_bn,geocode_en,remarks,filename,shape_leng,shape_area,geom,parent_plot) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36)";
                                                                                pool.query(qry5,[pd.pj_name_en,pd.pj_name_bn,pd.m_code,pd.m_div_en,pd.m_div_bn,pd.m_dist_en,pd.m_dist_bn,pd.m_thana_en,pd.m_thana_bn,pd.m_name_en,pd.m_name_bn,pd.jl_no_en,pd.jl_no_bn,pd.sht_no_en,pd.sht_no_bn,pd.l_code_en,pd.l_code_bn,pd.l_name_en,pd.l_name_bn,lastPlotId+2,lastPlotId+2,pd.sv_type_en,pd.sv_type_bn,pd.scale_en,pd.scale_bn,pd.sv_year_en,pd.sv_year_bn,pd.rev_no_en,pd.rev_no_bn,pd.geocode_en,pd.remarks,pd.filename,geom1Length.st_length,geom2Area.st_area,geom2.st_geomfromgeojson,pd.plot_no_en],(err,result)=>{
                                                                                    if(err) throw err;
                                                                                    else {
                                                                                        let qry6 = "UPDATE borolekh SET archrive_plot = $1 WHERE plot_no_en = $2";
                                                                                        pool.query(qry6,['y',pd.plot_no_en],(err,result)=>{
                                                                                            if(err) throw err;
                                                                                            else{
                                                                                                let qry9 = "select plot_no_en from borolekh order by plot_no_en asc";
                                                                                                pool.query(qry9, (err, results) => {
                                                                                                    if (err) throw err
                                                                                                    else {
                                                                                                        var plotList = results.rows;
                                                                                                        res.render('index',{plotList:results.rows});
                                                                                                    }
                                                                                                });
                                                                                            }
                                                                                        })
                                                                                        
                                                                                    }
                                                                                })
                                                                            }  
                                                                    });  
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            })
                                           
                                        }
                                    })
                                  
                                }
                            })     
                        }
                    })
                }
            })
        }
    })
   
    
            
    
      

  
   
})

app.post('/addnew-plot',(req,res)=>{
    const {gid,oid_,name,symbolid,area_h,geom} = req.body;
    
    let qry = "insert into mouza_map_drone(oid_,name,symbolid,area_h,geom) values($1,$2,$3,$4,$5)";
    pool.query(qry, [oid_,name,symbolid,area_h,geom], (err, results) => {
        if(err)throw err; 
        else  res.send("Data inserted Successfully");
    })
})  


app.get('/view-mouza',(req,res)=>{
    let qry = "SELECT plot_no_en,ST_AsGeoJSON(geom) FROM borolekh order by plot_no_en desc limit 2";
    //let qry = "select plot_no_en,ST_AsGeoJSON(geom) from borolekh order by plot_no_en desc limit 1,1 ;"
    pool.query(qry,(err,result)=>{
        if(err)throw err;
        else{
            var result = result.rows;
            let splittedGeoJsons = {
                "FirstPlot": {
                    "plotNo":result[0].plot_no_en,
                    "GeoJson":JSON.parse(result[0].st_asgeojson)
                },
                "SecondPlot":{
                    "plotNo":result[1].plot_no_en,
                     "GeoJson":JSON.parse(result[1].st_asgeojson)
                }
            }
         
            let GeoJSON = JSON.stringify(splittedGeoJsons);
            res.render('mapWithLabel',{GeoJSON});
        }
    })
    
});

app.get('/mapGeojson-api',(req,res)=>{
    //let qry = "SELECT ST_ASGeoJSON(geom),plot_no_en FROM borolekh  limit 2000 ";
    let qry = "select ST_AsGeoJSON(geom),plot_no_en  from borolekh Where archrive_plot  IS NULL";
    pool.query(qry,(err,result)=>{
        if(err)throw err;
        else {
            var result =  result.rows;
            let mapGeoJson = {"type":"FeatureCollection","features":[]};
            for(let i = 0;i<result.length;i++){
                let jsonData = JSON.parse(result[i].st_asgeojson);
                let plotGeoJson =  {"type":"Feature","properties":{"plot_no_en":""},"geometry":{"type":"Polygon","coordinates":[]}};
               
                plotGeoJson.properties = {"plot_no_en" : result[i].plot_no_en.toString()};
                let tempCoordinates = [];
                for(let i = 0;i<jsonData.coordinates[0][0].length;i++){
                    let utm = turf.point([jsonData.coordinates[0][0][i][0], jsonData.coordinates[0][0][i][1]]);
                    let latlong = turf.toWgs84(utm);
                    //console.log(latlong.geometry.coordinates)
                    tempCoordinates.push(latlong.geometry.coordinates);
                }
                plotGeoJson.geometry.coordinates = [tempCoordinates]
                mapGeoJson.features.push(plotGeoJson);
            }
            res.send(mapGeoJson);
        }
    });
})

app.get('/labeling-mutated-geojson-1',(req,res)=>{
    let qry = "select ST_AsGeoJSON(geom),plot_no_en  from borolekh order by plot_no_en desc LIMIT 1";
    pool.query(qry,(err,result)=>{
        if(err)throw err;
        else {
            var result =  result.rows;
            let mapGeoJson = {"type":"FeatureCollection","features":[]};
            for(let i = 0;i<result.length;i++){
                let jsonData = JSON.parse(result[i].st_asgeojson);
                let plotGeoJson =  {"type":"Feature","properties":{"plot_no_en":""},"geometry":{"type":"Polygon","coordinates":[]}};
               
                plotGeoJson.properties = {"plot_no_en" : result[i].plot_no_en.toString()};
                let tempCoordinates = [];
                for(let i = 0;i<jsonData.coordinates[0][0].length;i++){
                    let utm = turf.point([jsonData.coordinates[0][0][i][0], jsonData.coordinates[0][0][i][1]]);
                    let latlong = turf.toWgs84(utm);
                    //console.log(latlong.geometry.coordinates)
                    tempCoordinates.push(latlong.geometry.coordinates);
                }
                plotGeoJson.geometry.coordinates = [tempCoordinates]
                mapGeoJson.features.push(plotGeoJson);
            }
            res.send(mapGeoJson);
        }
    });
});

app.get('/labeling-mutated-geojson-2',(req,res)=>{
    let qry = "select ST_AsGeoJSON(geom),plot_no_en  from borolekh order by plot_no_en desc limit 1 offset 1 ";
    pool.query(qry,(err,result)=>{
        if(err)throw err;
        else {
            var result =  result.rows;
            let mapGeoJson = {"type":"FeatureCollection","features":[]};
            for(let i = 0;i<result.length;i++){
                let jsonData = JSON.parse(result[i].st_asgeojson);
                let plotGeoJson =  {"type":"Feature","properties":{"plot_no_en":""},"geometry":{"type":"Polygon","coordinates":[]}};
               
                plotGeoJson.properties = {"plot_no_en" : result[i].plot_no_en.toString()};
                let tempCoordinates = [];
                for(let i = 0;i<jsonData.coordinates[0][0].length;i++){
                    let utm = turf.point([jsonData.coordinates[0][0][i][0], jsonData.coordinates[0][0][i][1]]);
                    let latlong = turf.toWgs84(utm);
                    //console.log(latlong.geometry.coordinates)
                    tempCoordinates.push(latlong.geometry.coordinates);
                }
                plotGeoJson.geometry.coordinates = [tempCoordinates]
                mapGeoJson.features.push(plotGeoJson);
            }
            res.send(mapGeoJson);
        }
    });
});



app.get('/experiment-map-label',(req,res)=>{
    res.render('experimentMap');
})


app.post('/saveEqualSplitedPolygon',(req,res)=>{
    const {NSplittedGeoJsons} = req.body;
    const dividedSpFeatures = JSON.parse(NSplittedGeoJsons);
    res.send(dividedSpFeatures)
})

app.get('/print-url',(req,res)=>{
    var hostname = req.headers.host; // hostname = 'localhost:8080'
    var pathname = url.parse(req.url).pathname; // pathname = '/MyApp'
    res.send('http://' + hostname)
})



app.listen(PORT,()=>{
    console.log(`PORT is listen on ${PORT}`);
})

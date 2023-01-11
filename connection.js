const Pool = require('pg').Pool;
const pool = new Pool({
	user:"postgres",
	host:"localhost",
	database:"dynamic_image_processing",
	//database:"shapeFile_database",
	
	password:"ruhulamin",
	port:5432
});

module.exports = pool;

// const Pool = require('pg').Pool;
// const pool = new Pool({
// 	user:"gisclousr",
// 	host:"45.114.84.187",
// 	database:"land_mouja_map",
// 	password:"Gi!1oCuy67",
// 	port:33341
// });

// module.exports = pool;

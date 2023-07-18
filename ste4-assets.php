<?php
header("Content-type: application/json");
/*
// error_reporting
ini_set("display_errors", 1);
//error_reporting(0);
error_reporting(E_ERROR + E_PARSE);
error_reporting(E_ERROR + E_WARNING + E_PARSE);
//error_reporting(E_ALL);
 */
date_default_timezone_set('Europe/London');


define( 'IMG_ROOT', 'inc/ste4/' );
define( 'IMG_PREG',"(\d{4}-\d{2}-\d{2})_(\w{3}\d?)_" );
	
// list all files in IMG_ROOT
$arr = scandir(IMG_ROOT);


// filter to match regex format
/*  array_filter($arr, function($v, $k){
  return preg_match(IMG_PREG, $v) || true;
}); */

// filter to resutls that match elr or tlc
if($_GET['sid']) 
  $arr = array_filter($arr, function($v){
    return strpos($v, $_GET['sid']);
  });
else if($_GET['tlc']) 
  $arr = array_filter($arr, function($v){
    return strpos($v, $_GET['tlc']."_");
  });


// put in src
array_walk($arr, function(&$v){
  	$o = new stdClass();
	$o->src = IMG_ROOT.$v;
	$v = $o;
});

// wrap in object and output

$retvrn = new stdClass();
$retvrn->photos = array_values($arr); 
$retvrn->get = $_GET; 

echo json_encode($retvrn);
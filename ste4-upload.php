<?php

// receive uploaded fule and save it to a folder somewhere

// TODO: accept multiple files if submitted without JS somehow snd redirect on completion

$sid = $_POST['structure-id'];
if(!$sid) $sid = $_POST['tlc'];

foreach($_FILES as $f){

  if(!$f['name']) $f['name'] = "1.jpg"; //TODO autoincrement
  $newname = date('Y-m-d')."_".$sid."_".$f['name']; //TODO: sanitise toA-z0-9
  echo $newname;

  $success = move_uploaded_file($f['tmp_name'], 'inc/ste4/'.$newname);

  if(!$success) user_error('move_uploaded_file() failed');

  $exif = exif_read_data('inc/ste4/'.$newname, 0);

  echo "exif: DateTime: ".$exif["DateTime"];

if($exif["DateTime"]){
  //DateTime"]=> string(19) "2023:07:10 17:09:46"
  // could do date_parse_from_format and then  date('Y-m-d'), but why bother
  $exifdate = substr($exif["DateTime"],0,10);
  $isodate = str_replace(":", "-", $exifdate);
  $newnewname = $isodate."_".$sid."_".$f['name']; 
  rename('inc/ste4/'.$newname, 'inc/ste4/'.$newnewname);
  echo "rename($newname, $newnewname);";
}

 /*   ["DateTime"]=> or DTO */



}

// for all, make thumb 100x100+

// then search by listing all files and doing regex
// return array of obj, sort by mime(extension), size
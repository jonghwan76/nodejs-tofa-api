var express = require('express');
var url = require('url');
var router = express.Router();
const mysql = require('mysql2');
const commonMapper = require('mybatis-mapper');
var PropertiesReader = require('properties-reader');
// var properties = PropertiesReader('config/dev.properties');
var properties = PropertiesReader('config/real.properties');
var requestIp = require('request-ip');

const conn = {  // mysql 접속 설정
  host: properties.get("host"),
  port: properties.get("port"),
  user: properties.get("user"),
  password: properties.get("password"),
  database: properties.get("database")
};

commonMapper.createMapper([ 'mapper/common.xml' ]);
var connection = mysql.createConnection(conn); // DB 커넥션 생성
connection.connect();   // DB 접속

module.exports.auth_check = (req, p_access_key) => {
  return new Promise((resolve, reject) => {
    let ip = requestIp.getClientIp(req);
    let format = {language: 'sql', indent: ''};
    let queryAuth = commonMapper.getStatement('commonMapper', 'selectAuthKey', {access_key:p_access_key, client_ip:ip}, format);

    connection.query(queryAuth, function (err, rows, fields) {
      if(err) {
        console.log('Auth-query is not excuted. select fail...\n' + err);
        resolve(false);
      }
      else {
        if(rows[0].cnt > 0) {
          resolve(true);
        } else {
          console.log("Authentication failed.");
          resolve(false);
        }
      }
    });
  });
}
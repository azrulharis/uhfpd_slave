var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var path = require('path');
var server = require('http').createServer(app);
var cors = require('cors');
var io = require('socket.io')(server);
var mongo = require('mongodb').MongoClient;
// var client = require('socket.io').listen(4000).sockets;
var cookieParser = require('cookie-parser');
var urlencodedParser = bodyParser.urlencoded({extended : false});
var moment = require('moment-timezone');
var tcpp = require('tcp-ping');
var WatchJS = require("watchjs");
var watch = WatchJS.watch;
var http_send = require('http');
// var CronJob = require('cron').CronJob;
var cron = require('node-cron');


const SerialPort = require('serialport');
const ModbusMaster = require('modbus-rtu').ModbusMaster;
const serialPort = new SerialPort("COM23", { // /dev/ttyUSB0
   baudRate: 9600
});
const master = new ModbusMaster(serialPort);



const ipInfo = require("ipinfo");
var _ = require("underscore");
var fs = require('fs');


var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://psdtech-d6832.firebaseio.com"
});


// node command line
var cmd     = require('node-command-line');
var Promise = require('bluebird');




// serialPort 에러 발생시 에러 처리
 
serialPort.on('error', function(err) {
  setTimeout(function() {
    process.exit(0);
  }, 1000*60); // 1분
  console.log('Error: ', err.message);
})
 

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));
app.use(cors());




// 기본장치 동작 원리
// 디비서버에 저장은 장치를 여러개 해놓고 실제 설치 되어 있는 장치 갯수가 모자르면 동작안함
// 디비저장은 1개만 해놓고 장치 여러개면 동작함
// 어쨋든 디비서버와 설치 되어 있는것의 수량은 지킬 것




app.get('/', function(req, res){
  // 읽을 때는 string을 json형태로 만들어서 읽기
  var server_ip_data = fs.readFileSync('server_ip_data.json', 'utf8');
  var server_ip_data_back = JSON.parse(server_ip_data);
  res.render('index', {
    serialnumbers: app.locals.serialnumbers,
    getipAddresses: getipAddresses,
    host_name: server_ip_data_back.host_name,
    host_port: server_ip_data_back.host_port,
    device_state: app.locals.device_state
  });
});



app.post('/db_server_update', urlencodedParser, function(req, res){
  // console.log(req.body)
  var get_db_server_data = {
    "host_name": req.body.host_name,
    "host_port": "7000"
  }
  fs.writeFileSync('server_ip_data.json', JSON.stringify(get_db_server_data), 'utf8');

  setTimeout(function() {
    // 읽어서 바뀐 시리얼 번호 전송
    var device_serialnumbers_data = fs.readFileSync('server_ip_data.json', 'utf8');
    var device_serialnumbers_back = JSON.parse(device_serialnumbers_data);
    app.locals.host_name = device_serialnumbers_back.host_name
    res.render('index', {
      serialnumbers: app.locals.serialnumbers,
      getipAddresses: getipAddresses,
      host_name: app.locals.host_name,
      host_port: app.locals.host_port,
      device_state: app.locals.device_state
    });
  }, 1000);

});







app.get('/serialnumbers_update', function(req, res){
  res.render('serialnumbers_update', {
    serialnumbers: app.locals.serialnumbers
  });
});




//////////////////////////////////////////// 모드버스 서버 ////////////////////////////////////////////

var my_local_ip_result;

// 로컬 ip 가져오기
function getIPAddresses() {
    var ipAddresses;
    var interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) {
        var iface = interfaces[devName];
        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                ipAddresses = alias.address;
            }
        }
    }
    return ipAddresses;
}

var getipAddresses = getIPAddresses();


/*
var ModbusRTU = require("modbus-serial");
var mb = new ModbusRTU();

mb.connectRTUBuffered("COM23", { baudRate: 9600 })
    .then(function() {
        console.log("connectRTUBuffered Connected"); })
    .catch(function(e) {
        console.log("connectRTUBuffered ", e.message); });
// set timeout, if slave did not reply back
mb.setTimeout(1000);

// start get value
// 장치 상태 전역변수


// list of meter's id
const metersIdList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

const getMetersValue = async (meters) => {
  try{
    // get value of all meters
    for(let meter of meters) {
      // output value to console
      console.log('Meter ' , await getMeterValue(meter));
      // wait 100ms before get another device
      await sleep(200);
    }
  } catch(e){
    // if error, handle them here (it should not)
    console.log('ERROR RTU ', e)
  } finally {
    // after get all data from salve repeate it again
    setImmediate(() => {
        getMetersValue(metersIdList);
    })
  }
}

const getMeterValue = async (id) => {
  try {
    // set ID of slave
    await mb.setID(id);
    // read the 1 registers starting at address 0 (first register)
    let val =  await mb.readInputRegisters(0, 2);
    // return the value
    return val.data[0];
  } catch(e) {
    // if error return -1
    console.log('Err 3', e)
    return -1;
  }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));




// 디비데이터 불러온 값으로 모드버스 데이터 불러오기 
getMetersValue(metersIdList); 
*/

//////////////////////////////////////////// 모드버스 서버 ////////////////////////////////////////////






////////////////////////////////////////////장치 재부팅////////////////////////////////////////////

// 장치 재부팅
app.post('/device_reboot', urlencodedParser, function(req, res){
  if(req.body.reboot == 'reboot'){
    res.status(200).json({status:"ok"});
    setTimeout(function() {
      cmd.run('sudo reboot');
    }, 1000);
  }
});
////////////////////////////////////////////장치 재부팅////////////////////////////////////////////






////////////////////////////////////////////기본정보////////////////////////////////////////////


// 장치번호
// 시리얼 번호 변경
var device_serialnumbers_data = fs.readFileSync('device_serialnumbers.json', 'utf8');
var device_serialnumbers_back = JSON.parse(device_serialnumbers_data);
app.locals.serialnumbers = device_serialnumbers_back.serialnumbers;


app.post('/local_serialnumbers_update', urlencodedParser, function(req, res){
  var get_device_serialnumbers_data = {
    "serialnumbers": req.body.serialnumbers
  }
  fs.writeFileSync('device_serialnumbers.json', JSON.stringify(get_device_serialnumbers_data), 'utf8');

  setTimeout(function() {
    // 읽어서 바뀐 시리얼 번호 전송
    var device_serialnumbers_data = fs.readFileSync('device_serialnumbers.json', 'utf8');
    var device_serialnumbers_back = JSON.parse(device_serialnumbers_data);
    app.locals.serialnumbers = device_serialnumbers_back.serialnumbers;
    res.status(200).json({status: app.locals.serialnumbers});
  }, 1000);

});



// 중앙서버 ip및 port변경
// 읽을 때는 string을 json형태로 만들어서 읽기
var server_ip_data = fs.readFileSync('server_ip_data.json', 'utf8');
var server_ip_data_back = JSON.parse(server_ip_data);
app.locals.host_name = server_ip_data_back.host_name;
app.locals.host_port = server_ip_data_back.host_port;


// server ip & port 저장 (비상시 - 서버가 바뀌었을 때 통신후 로드
// 아래에 로컬장치가 초기 켜질때도 상호 확인을 위해 서버 ip와 port 값을 전송해주는 코드가 있음)
app.post('/get_server_ip_data', urlencodedParser, function(req, res){
  // 저장할때는 json을 string으로 만들어서 저장
  var get_server_ip_data = {
    "host_name": req.body.host_name,
    "host_port": req.body.host_port
  }

  app.locals.req_host_name = req.body.host_name;
  app.locals.req_host_port = req.body.host_port;

  tcpp.probe(app.locals.req_host_name, app.locals.req_host_port, function(err, available) {
    // 비정상적인 서버일때는 예전IP값을 그대로 가지고 있는 상태로 있음.
    if(available == false) {
      // console.log("서버ip변동 주서버 이용 불가능", available);
      res.status(200).json({status:"no"});
    } if(available == true) {
      // 정상적인 서버일때는 재부팅 (정상적인 중앙서버이고(&&) ip변경을 요청하면 재부팅)
      // console.log("서버ip변동 주서버 이용 가능", available);
      // 서버로 수신받은 ip와 port 전송
      app.locals.host_name = app.locals.req_host_name;
      app.locals.host_port = app.locals.req_host_port;
      main_server_ip_update();
      main_server_port_update();
      res.status(200).json({status:"ok"});
      fs.writeFileSync('server_ip_data.json', JSON.stringify(get_server_ip_data), 'utf8');
      setTimeout(function() {
        process.exit(0);
      }, 2000);
    }
  });

});

// var exist_host_name = fs.existsSync('host_name.json');
//   console.log("Sync 파일존재?: ", exist_host_name);


////////////////////////////////////////////기본정보////////////////////////////////////////////


mongoose.Promise = global.Promise;
// mongoose.connect('mongodb://pulsegood1:pulsegood1346@'+ app.locals.host_name +':27017/pulsegood' , { useMongoClient: true });
// mongoose.connect('mongodb://ictlab21.iptime.org:13466/pulsegood' , { useMongoClient: true });


mongoose.connect('mongodb://' + app.locals.host_name +':27017/pulsegood' , { useMongoClient: true });


// mongoose.connect('mongodb://' + 'pulsegood1:pulsegood1346@192.168.0.2' +':27017/pulsegood' , { useMongoClient: true });


var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('MongoDB connected!');
});


var UserSchema = new mongoose.Schema({
  username: {
    type: String
  },
  serialnumbers: {
    type: String
  }, // 유니크한 키값 // 소켓 룸으로 활용.
  password: {
    type: String
  },
  passwordConf: {
    type: String
  },
  admin_username: {
    type: String
  },
  admin_password: {
    type: String
  },
  admin_passwordConf: {
    type: String
  },
  adminConf: {
    type: String
  },
  adminConf_sub: {
    type: String
  },
  system_version: {
    type: String
  },
  created_date: {
    type: Date,
    default: new Date().getTime()
  },
  devices: [
    {
      group_name: String,
      group_locaion_ip: String,
      group_locaion_port: String,
      group_sub_serialnumbers: String,  //이건 장치 호스트네임
      group_communication_state: String,
      // group_device_count: String,
      group_send_server_time: String, // 서버로 전송하는 시간
      group_send_server_delay_time: String, // 알람 발생 시 대기 시간
      group_sort:String,
      group_translate:String,
      group_main_server_ip:String, // 장치의 데이터 저장 목적지인 server_ip 주소
      group_main_server_port:String, // 장치의 데이터 저장 목적지인 server_port 주소
      group_trend_send_time:String // 트랜드 데이터 전송 시간 (분)
    },
    { _id: false }
  ],
  tokens: [
    {
      token: String
    },
    { _id: false }
  ],
  markers: [
    {
      coords_lat: String,
      coords_lng: String,
      content: String,
      map_location: String,
      map_main_admin: String,
      map_main_admin_contact: String,
      map_sub_admin: String,
      map_sub_admin_contact: String,
      map_description: String,
      etc1: String,
      etc2: String
    },
    { _id: false }
  ]
});
var User = mongoose.model('User', UserSchema);

var ppsSchema = new mongoose.Schema({
  pulse: {  
    type: Number
  },
  device: {  
    type: Number
  },
  status: {  
    type: Number
  } 
});
var PPS = mongoose.model('pps', ppsSchema);  


var device_infoSchema = new mongoose.Schema({
  group_name: {
    type: String
  },
  group_locaion_ip: {
    type: String
  },
  group_locaion_port: {
    type: String
  },
  group_sub_serialnumbers: {
    type: String
  },
  group_communication_state: {
    type: String
  },
  group_send_server_delay_time: {
    type: String
  },
  group_send_server_time: {
    type: String
  },
  group_sort: {
    type: String
  },
  group_translate: { //로컬 장치 기준 언어 (메인)
    type: String
  },
  group_main_server_ip: { // 장치의 데이터 저장 목적지인 server_ip 주소
    type: String
  },
  group_main_server_port: { // 장치의 데이터 저장 목적지인 server_port 주소
    type: String
  },
  group_trend_send_time: { // 트랜드 데이터 전송 시간 (분)
    type: String
  },
  device: [
    {
      device_name: String,
      device_id: String,
      device_version: String,
      device_warning_standard: String, // 경고 기준 값
      device_alarm_standard: String, // 알람 기준 값

      device_warning_standard_delay: String, // 경고 기준 딜레이 값 (초)
      device_alarm_standard_delay: String, // 알람 기준 딜레이 값 (초)

      device_warning_standard_delay_persent: String, // 경고 기준 딜레이 비율 값 (초)
      device_alarm_standard_delay_persent: String, // 알람 기준 딜레이 비율 값 (초)

      // device_get_alarm_time: String, // 장치의 최종 알람 받는 시간
      // device_get_alarm_count: String, // 장치의 알람 개수
      device_sort: String
    },
    { _id: false }
  ]
});
var Device_info = mongoose.model('Device_info', device_infoSchema);



var device_alarmSchema = new mongoose.Schema({
  group_name: { //장치 그룹이름 프론트에서 사용
    type: String
  },
  device_name: { //장치 이름 프론트에서 사용
    type: String
  },
  confirm: {
    type: String
  },
  group_sub_serialnumbers: { //시리얼번호는 서버에서 찾을 용도로 사용
    type: String
  },
  alarm_value: {
    type: String
  },
  record_date: {
    type: String
  },
  created_date: {
    type: Date,
    default: new Date().getTime()
  }
});
var Device_alarm = mongoose.model('Device_alarm', device_alarmSchema);


var device_dataSchema = new mongoose.Schema({
  device_name: { //장치 이름 프론트에서 사용
    type: String
  },
  confirm: {
    type: String
  },
  group_sub_serialnumbers: { //시리얼번호는 서버에서 찾을 용도로 사용
    type: String
  },
  alarm_min_value: {
    type: String
  },
  alarm_avg_value: {
    type: String
  },
  alarm_max_value: {
    type: String
  },
  record_date: {
    type: String
  },
  created_date: {
    type: Date,
    default: new Date().getTime()
  }
});

var Device_data = mongoose.model('Device_data', device_dataSchema);


// 공인 IP 가져오고 공인 서버에 기록 하기.
// app.locals.main_ip = undefined;

// ipInfo((err, cLoc) => {
//     app.locals.main_ip = cLoc.ip;
// });

// setInterval(function() {
//   ipInfo((err, cLoc) => {
//       app.locals.main_ip = cLoc.ip;
//   });
// }, 1000*60*10); // 10분

// watch(app.locals, "main_ip", function(prop, action, newvalue, oldvalue){
//   main_ip_update();
// });
//
// // 로컬 장치의 ip 전송
// function main_ip_update(){
//   User.update({'devices.group_sub_serialnumbers': app.locals.serialnumbers},
//   {$set: {
//     'devices.$.group_locaion_ip': app.locals.main_ip
//   }}, {multi: true}, function(err,data){
//     Device_info.findOneAndUpdate({'group_sub_serialnumbers': app.locals.serialnumbers},
//     {$set: {
//       'group_locaion_ip': app.locals.main_ip
//     }}, {new: true}, function(err,results){
//       if (err) throw err;
//     });
//   });
// }


// 로컬 IP 가져오고 공인 서버에 기록 하기.
app.locals.main_ip = undefined;


setTimeout(function() {
  app.locals.main_ip = getipAddresses;
}, 3000);


watch(app.locals, "main_ip", function(prop, action, newvalue, oldvalue){
  main_ip_update();
});

// 로컬 장치의 ip 전송
function main_ip_update(){
  User.update({'devices.group_sub_serialnumbers': app.locals.serialnumbers},
  {$set: {
    'devices.$.group_locaion_ip': app.locals.main_ip
  }}, {multi: true}, function(err,data){
    Device_info.findOneAndUpdate({'group_sub_serialnumbers': app.locals.serialnumbers},
    {$set: {
      'group_locaion_ip': app.locals.main_ip
    }}, {new: true}, function(err,results){
      if (err) throw err;
    });
  });
}




// 저장되어 있는 중앙서버의 ip 전송
function main_server_ip_update() {
  User.update({'devices.group_sub_serialnumbers': app.locals.serialnumbers},
  {$set: {
    'devices.$.group_main_server_ip': app.locals.host_name
  }}, {multi: true}, function(err,data){
    Device_info.findOneAndUpdate({'group_sub_serialnumbers': app.locals.serialnumbers},
    {$set: {
      'group_main_server_ip': app.locals.host_name
    }}, {new: true}, function(err,results){
      if (err) throw err;
    });
  });
}

// 저장되어 있는 중앙서버의 port 전송
function main_server_port_update(){
  User.update({'devices.group_sub_serialnumbers': app.locals.serialnumbers},
  {$set: {
    'devices.$.group_main_server_port': app.locals.host_port
  }}, {multi: true}, function(err,data){
    Device_info.findOneAndUpdate({'group_sub_serialnumbers': app.locals.serialnumbers},
    {$set: {
      'group_main_server_port': app.locals.host_port
    }}, {new: true}, function(err,results){
      if (err) throw err;
    });
  });
}

main_server_ip_update();
main_server_port_update();


////////////////////////////////////////////디폴트////////////////////////////////////////////




// 최초 DB Data 로드
app.locals.group_send_server_delay_time; // 푸쉬 대기 시간
var group_send_server_delay_time_array = []; // 푸쉬 대기시간 저장 어레이
app.locals.group_name; // 푸쉬 및 서버알람(지도)에 활용되는 [그룹 이름]
app.locals.group_send_server_time; // 서버로 보내는 시간
app.locals.group_translate; // 푸쉬 언어 선택


app.locals.group_trend_send_time; // 트랜드 데이터 전송 시간 (분)


var device_name = []; // 푸쉬에 활용되는 [장치 이름]
var device_modbus_id = []; // modbus에 활용되는 [장치 ID]
var device_version = []; // modbus에 활용되는 [장치 version]
var device_warning_standard = []; // 푸쉬에 활용되는 [장치 device_warning_standard]
var device_alarm_standard = []; // 푸쉬에 활용되는 [장치 device_alarm_standard]




var device_warning_standard_delay = []; // 경고 기준 딜레이 값 (초)
var device_alarm_standard_delay = []; // 알람 기준 딜레이 값 (초)
var device_warning_standard_delay_persent = []; // 경고 기준 딜레이 비율 값 (초)
var device_alarm_standard_delay_persent = []; // 알람 기준 딜레이 비율 값 (초)



var device_version_sum = 0; // 모드버스 서버용 모든 어레이 sum (맵핑 불러 올때 갯수의 합 ex) 3,4 이면 7개 )
var device_version_sum_after = 0; // 모드버스 서버용 모든 어레이 sum (맵핑 불러 올때 갯수의 합 ex) 3,4 이면 7개 )

var Device_info_data = [];



// 디바이스 실행 시 최초 디비데이터 불러오기
function find_device_info_data(){
  Device_info.findOne({group_sub_serialnumbers: app.locals.serialnumbers}, function(err,data){
    if (err) throw err;
    if (data !== null) {

      Device_info_data = data.device;
      app.locals.group_name = data.group_name;
      app.locals.group_send_server_delay_time = Number(data.group_send_server_delay_time);
      app.locals.group_send_server_time = Number(data.group_send_server_time);
      app.locals.group_translate = data.group_translate;

      if(data.group_trend_send_time == 'm1'){
        app.locals.group_trend_send_time = '*/1 * * * *';
      } else if (data.group_trend_send_time == 'm5') {
        app.locals.group_trend_send_time = '*/5 * * * *';
      } else if (data.group_trend_send_time == 'm10') {
        app.locals.group_trend_send_time = '*/10 * * * *';
      } else if (data.group_trend_send_time == 'm15') {
        app.locals.group_trend_send_time = '*/15 * * * *';
      } else if (data.group_trend_send_time == 'm30') {
        app.locals.group_trend_send_time = '*/30 * * * *';
      } else if (data.group_trend_send_time == 'h1') {
        app.locals.group_trend_send_time = '0 */1 * * *';
      } else if (data.group_trend_send_time == 'h2') {
        app.locals.group_trend_send_time = '0 */2 * * *';
      } else if (data.group_trend_send_time == 'h3') {
        app.locals.group_trend_send_time = '0 */3 * * *';
      } else if (data.group_trend_send_time == 'h4') {
        app.locals.group_trend_send_time = '0 */4 * * *';
      } else if (data.group_trend_send_time == 'h5') {
        app.locals.group_trend_send_time = '0 */5 * * *';
      }


      data.device.forEach(function(element, index) {
          device_name.push( element.device_name );
          device_modbus_id.push( element.device_id );
          device_version.push( element.device_version );
          device_warning_standard.push( element.device_warning_standard );
          device_alarm_standard.push( element.device_alarm_standard );
          device_warning_standard_delay.push( Number(element.device_warning_standard_delay) );
          device_alarm_standard_delay.push( Number(element.device_alarm_standard_delay) );
          device_warning_standard_delay_persent.push( Number(element.device_warning_standard_delay_persent) );
          device_alarm_standard_delay_persent.push( Number(element.device_alarm_standard_delay_persent) );
          group_send_server_delay_time_array.push(Number(app.locals.group_send_server_delay_time));
      });


      setTimeout(function() {
        // 모드버스 서버용 모든 어레이 sum (맵핑 불러 올때 갯수의 합 ex) 3,4 이면 7개 )
        for (var z=0; z < device_version.length; z++ ) {
            device_version_sum += Number(device_version[z]);
        }
      }, 3000);

      get_modbus_device_data();
    }
  });
}
// 디바이스 실행 시 최초 디비데이터 불러오기 펑션 실행
find_device_info_data(); 

app.locals.device_state = "device_com_ok";

// 기본 모드버스 어레이 지정
var get_modbus_default_array = [];

// 가공 모드버스 어레이 지정
var get_modbus_after_array = [];

// 기본 모드버스 서버용 어레이 지정
var modbus_server_values_before = [];

// 가공 모드버스 서버용 어레이 지정
var modbus_server_values_before_after = [];

app.locals.device_response = []; 

function get_modbus_device_data() {
   setInterval(function() {
     // console.log(device_modbus_id)
     // console.log(device_version)
    for(var i=0; i < device_modbus_id.length; i++) {
       // 모드버스 데이터 불러오는데 push를 할 때 전체디바이스 갯수 보다 넘으면 지우고 낮으면 넣기 (즉, 디바이스 갯수만큼만 넣고 그 이상대면 배열 초기화 시키기)
       // 불러오는 순서는 DB에 저장되어있는 모드버스 아이디 순서 (ex 1,4,3 순서면 그 순서대로 데이터 읽기를 시도함.) 

        master.readHoldingRegisters(Number(device_modbus_id[i]), 0, Number(device_version[i])).then((data) => {
          app.locals.device_state = "device_com_ok";
          get_modbus_default_array.push(data[0]);
 

          if(get_modbus_default_array.length >= Device_info_data.length) {
            get_modbus_after_array = get_modbus_default_array;
            app.locals.get_modbus_after_array_start = "1";
            alarm_total_arr_get();
            get_modbus_default_array = [];
          }

          // 모드버스 서버용 모든 어레이 sum (맵핑 불러 올때 갯수의 합 ex) 3,4 이면 7개 )
          for(var x=0; x < data.length; x++) {
            modbus_server_values_before.push(data[x])
          }
          if(modbus_server_values_before.length >= device_version_sum) {
            // console.log("modbus_server_values_before", modbus_server_values_before)
            modbus_server_values_before_after = modbus_server_values_before;
            modbus_server_values_before = [];
            // console.log("device_version_sum", device_version_sum)
          }

        }, (err) => {
          // 데이터 불러 올때 디비에는 2개 되어 있고, 장치 하나가 선이 연결 안되어 있으면, 불러는 와지나 하나씩 배열에 차곡차곡 쌓음
          // 그래서 갯수가 틀리면 그냥 강제 종료
 
          get_modbus_default_array.push(-1); 

          if(get_modbus_default_array.length >= Device_info_data.length) {
            get_modbus_after_array = get_modbus_default_array;
            app.locals.get_modbus_after_array_start = "1";
            alarm_total_arr_get();
            get_modbus_default_array = [];
          }  
          app.locals.device_state = "device_com_err";
        }); 
    }
    //console.log("re ", app.locals.device_response)
  }, 1000);
} 
 
function get_modbus_device_data_2() {
   setInterval(function() {
     // console.log(device_modbus_id)
     // console.log(device_version)
    for(var i=0; i < device_modbus_id.length; i++) {
       // 모드버스 데이터 불러오는데 push를 할 때 전체디바이스 갯수 보다 넘으면 지우고 낮으면 넣기 (즉, 디바이스 갯수만큼만 넣고 그 이상대면 배열 초기화 시키기)
       // 불러오는 순서는 DB에 저장되어있는 모드버스 아이디 순서 (ex 1,4,3 순서면 그 순서대로 데이터 읽기를 시도함.) 

        master.readHoldingRegisters(Number(device_modbus_id[i]), 0, Number(device_version[i])).then((data) => {
          app.locals.device_state = "device_com_ok";
          get_modbus_default_array.push(data[0]); 

          if(get_modbus_default_array.length >= Device_info_data.length) {
            get_modbus_after_array = get_modbus_default_array;
            app.locals.get_modbus_after_array_start = "1";
            alarm_total_arr_get();
            get_modbus_default_array = [];
          }

          // 모드버스 서버용 모든 어레이 sum (맵핑 불러 올때 갯수의 합 ex) 3,4 이면 7개 )
          for(var x=0; x < data.length; x++) {
            modbus_server_values_before.push(data[x])
          }
          if(modbus_server_values_before.length >= device_version_sum){
            // console.log("modbus_server_values_before", modbus_server_values_before)
            modbus_server_values_before_after = modbus_server_values_before;
            modbus_server_values_before = [];
            // console.log("device_version_sum", device_version_sum)
          }
 
        }, (err) => {
          // 데이터 불러 올때 디비에는 2개 되어 있고, 장치 하나가 선이 연결 안되어 있으면, 불러는 와지나 하나씩 배열에 차곡차곡 쌓음
          // 그래서 갯수가 틀리면 그냥 강제 종료
 
          console.log("모드버스 통신 불러오기 이상 (장치고장 혹은 하나라도 꺼져 있는 경우)");
          setTimeout(function() {
            process.exit(0);
          }, 1000 * 60 * 5); // 5분 후 재부팅 

          app.locals.device_state = "device_com_err";
        }); 
    }
    //console.log("re ", app.locals.device_response)
  }, 1000);
}
 

// 접속 확인 후 디비데이터 다시 불러와서 적용하기
app.post('/local_device_connect', urlencodedParser, function(req, res) {
  Device_info.findOne({group_sub_serialnumbers: app.locals.serialnumbers}, function(err,data){
    if (err) throw err;
    if (data !== null) {

      var device_name_after = [];
      var device_modbus_id_after = [];
      var device_version_after = [];
      var device_warning_standard_after = [];
      var device_alarm_standard_after = [];
      var group_send_server_delay_time_array_after = [];

      var device_warning_standard_delay_after = [];
      var device_alarm_standard_delay_after = [];
      var device_warning_standard_delay_persent_after = [];
      var device_alarm_standard_delay_persent_after = [];


      Device_info_data = data.device;

      app.locals.group_name = data.group_name;
      app.locals.group_send_server_delay_time = Number(data.group_send_server_delay_time);
      app.locals.group_send_server_time = Number(data.group_send_server_time);
      app.locals.group_translate = data.group_translate;

      if(data.group_trend_send_time == 'm1'){
        app.locals.group_trend_send_time = '*/1 * * * *';
      } else if (data.group_trend_send_time == 'm5') {
        app.locals.group_trend_send_time = '*/5 * * * *';
      } else if (data.group_trend_send_time == 'm10') {
        app.locals.group_trend_send_time = '*/10 * * * *';
      } else if (data.group_trend_send_time == 'm15') {
        app.locals.group_trend_send_time = '*/15 * * * *';
      } else if (data.group_trend_send_time == 'm30') {
        app.locals.group_trend_send_time = '*/30 * * * *';
      } else if (data.group_trend_send_time == 'h1') {
        app.locals.group_trend_send_time = '0 */1 * * *';
      } else if (data.group_trend_send_time == 'h2') {
        app.locals.group_trend_send_time = '0 */2 * * *';
      } else if (data.group_trend_send_time == 'h3') {
        app.locals.group_trend_send_time = '0 */3 * * *';
      } else if (data.group_trend_send_time == 'h4') {
        app.locals.group_trend_send_time = '0 */4 * * *';
      } else if (data.group_trend_send_time == 'h5') {
        app.locals.group_trend_send_time = '0 */5 * * *';
      } 

      data.device.forEach(function(element, index) {
          device_name_after.push( element.device_name );
          device_modbus_id_after.push( element.device_id );
          device_version_after.push( element.device_version );
          device_warning_standard_after.push( element.device_warning_standard );
          device_alarm_standard_after.push( element.device_alarm_standard );

          device_warning_standard_delay_after.push( Number(element.device_warning_standard_delay) );
          device_alarm_standard_delay_after.push( Number(element.device_alarm_standard_delay) );
          device_warning_standard_delay_persent_after.push( Number(element.device_warning_standard_delay_persent) );
          device_alarm_standard_delay_persent_after.push( Number(element.device_alarm_standard_delay_persent) );

          group_send_server_delay_time_array_after.push(Number(app.locals.group_send_server_delay_time));
      });

      device_name = device_name_after;
      device_modbus_id = device_modbus_id_after;
      device_version = device_version_after;
      device_warning_standard = device_warning_standard_after;
      device_alarm_standard = device_alarm_standard_after;

      device_warning_standard_delay = device_warning_standard_delay_after;
      device_alarm_standard_delay = device_alarm_standard_delay_after;
      device_warning_standard_delay_persent = device_warning_standard_delay_persent_after;
      device_alarm_standard_delay_persent = device_alarm_standard_delay_persent_after;
      group_send_server_delay_time_array = group_send_server_delay_time_array_after;

      device_version_sum_after = 0;
      setTimeout(function() {
        // 모드버스 서버용 모든 어레이 sum (맵핑 불러 올때 갯수의 합 ex) 3,4 이면 7개 )
        for (var z = 0; z < device_version.length; z++ ) {
            device_version_sum_after += Number(device_version[z]);
        }
      }, 1000);

      setTimeout(function() {
        if(device_version_sum !== device_version_sum_after){
          device_version_sum = device_version_sum_after;
        }
      }, 2000); 

    }
  });
  res.status(200).json({status: "ok"});
});
 
app.post('/off_alarm', urlencodedParser, function(req, res) {

  console.log('OK ', req.body.device_id)
  
  PPS.findOneAndUpdate({'device': req.body.device_id},
  {$set: {
    'status': 2
  }}, {new: true}, function(err,data) {
    if (err) throw err;
    
    console.log('Update OK ', req.body.device_id)  
  });

  setTimeout(function(){
    PPS.findOneAndUpdate({'device': req.body.device_id},
      {$set: {
        'status': 0
      }}, {new: true}, function(err,data) { 
        console.log('Update OK 2')
      });

    res.status(200).json({status:"ok"}) 
    
  }, 2000); 
}); 

app.post('/get_pulse', urlencodedParser, function(req, res) { 
  PPS.find({}, function(error, pps) {   
    res.status(200).json({pps});
  });     
});

// 클라이언트와 데이터 전송 통신 (기본데이터 전송)
app.post('/get_local_device_data', urlencodedParser, function(req, res){
    if(get_modbus_after_array.length == Device_info_data.length){
      var send_device_data =
      {
        device_state : app.locals.device_state,
        data : get_modbus_after_array,
        id: device_modbus_id
      }
    }
  // console.log(send_device_data)
  res.status(200).json({send_device_data});
});


// 상태 확인 통신 (서버쪽에서 인터넷 살아 있는지 상태 알아 보려는 용도)
app.post('/get_local_device_status', urlencodedParser, function(req, res){
  res.status(200).json({status: "ok"});
});

////////////////////////////실시간 데이터 데이터베이스 전송 및 푸쉬 언어 선택 로직//////////////////////////// 
var push_title;
var push_body;
var push_color; 

// 푸쉬 대기 시간 인터벌
var group_send_server_delay_time_interval = new Array();
// 푸쉬 대기 상태 스트링
var group_send_server_delay_time_status_array = [];



// 알람 체크 & 전송 로직
main_check_task = cron.schedule('* * * * * *', () =>  {
  _.each(alarm_total_counting_arr, function (element, index, list) {

    // 해당 데이터 어레이에 값이 있으면 시작
    if(alarm_total_counting_arr[index]){

      // 하나, 해당 데이터 어레이의 값과 해당 카운팅 기준값이 일치하면 (즉, 카운팅 갯수만큼 체크하여) (배열 초기화 - 즉 모든 계산이 끝난 시점에 - 아래)
      if(alarm_total_counting_arr[index].length >= device_warning_standard_delay[index]){

        // 둘, 전체 카운팅 갯수 중에 워닝 값에 해당 하는 갯수를 찾은뒤
        var count_data_warning = _.countBy(alarm_total_counting_arr[index], function(num){
          return num >= Number(device_warning_standard[index]) ? 'up': 'down'; // 워닝 값 비교
        });

        // 둘, 전체 카운팅 갯수 중에 알랏 값에 해당 하는 갯수를 찾은뒤
        var count_data_alarm = _.countBy(alarm_total_counting_arr[index], function(num){
          return num >= Number(device_alarm_standard[index]) ? 'up': 'down'; // 워닝 값 비교
        });


        // 셋, 카운팅 갯수가 기준값*비율 보다 크면 데이터 저장 및 푸쉬전송 (데이터 저장은 무조건)
        if((count_data_warning.up) || (count_data_alarm.up)){

          var alarm_log = Math.ceil(device_alarm_standard_delay[index] * (device_alarm_standard_delay_persent[index]/100));

          if(count_data_alarm.up >= Math.ceil(device_alarm_standard_delay[index] * (device_alarm_standard_delay_persent[index]/100))){

            console.log('ALM ', count_data_alarm.up, alarm_log)

            // 알람값 기준치 이상시 저장하는 로직 (카운팅 갯수가 기준값*비율 보다 크면 데이터 저장)
            app.locals.send_alarm_each_device_value =
            {
              "group_name": app.locals.group_name,
              "device_name": device_name[index],
              "confirm": "false",
              "group_sub_serialnumbers": app.locals.serialnumbers,
              "alarm_value": _.max(alarm_total_counting_arr[index]),
              "record_date": moment(new Date().getTime()).format("YYYY-MM-DD HH:mm:ss"),
              "created_date": new Date().getTime()
            };
            send_alarm_data();

            // 푸쉬전송로직 (딜레이 적용)
            if(group_send_server_delay_time_status_array[index] != "ON"){
              // 푸쉬 발생시 푸쉬 알림 전송 중지 시간
              group_send_server_delay_time_interval[index] = setInterval(function () {
                // 푸쉬 발생시 상태값 저장
                group_send_server_delay_time_status_array[index] = "ON";
                // 푸쉬 발생시 지정시간동안 카운트 1초씩 감산
                group_send_server_delay_time_array[index] = group_send_server_delay_time_array[index] - 1000;
                // 푸쉬 대기 시간이 종료 되면 (지정된 시간이 종료되면) 푸쉬를 다시 사용 할 수 있게끔 하기.
                if(group_send_server_delay_time_array[index] <= 0){
                  group_send_server_delay_time_status_array[index] = "OFF";
                  clearInterval(group_send_server_delay_time_interval[index]);
                  group_send_server_delay_time_array[index] = app.locals.group_send_server_delay_time;
                }
              }, 1000);
              // console.log(index, "[이상] 알람알람알람알람알람알람알람 푸쉬알림전송")
              // console.log(index, alarm_total_counting_arr[index]) //test
              // console.log(index, group_send_server_delay_time_interval[index]) //test
              // console.log(index, group_send_server_delay_time_status_array[index]) //test
              // console.log(index, device_alarm_standard[index]) //test
              // 푸쉬 부분 (언어 적용)
              if(app.locals.group_translate == 'korean'){
                push_title = "경보상태 : 경고";
                push_body = "장소 : " + app.locals.group_name + " / 이름 : " + device_name[index] + " / 수치 : " + _.max(alarm_total_counting_arr[index]) + "PPS";
                push_color = "#ff1744";
                send_alarm_push();
              } else if(app.locals.group_translate == 'malaysian'){
                push_title = "Alert state : Alert";
                push_body = "Site : " + app.locals.group_name + " / Name : " + device_name[index] + " / Value : " + _.max(alarm_total_counting_arr[index]) + "PPS";
                push_color = "#ff1744";
                send_alarm_push();
              } else if(app.locals.group_translate == 'english'){
                push_title = "Alert state : Alert";
                push_body = "Site : " + app.locals.group_name + " / Name : " + device_name[index] + " / Value : " + _.max(alarm_total_counting_arr[index]) + "PPS";
                push_color = "#ff1744";
                send_alarm_push();
              }

            }



          } else if(count_data_warning.up >= Math.ceil(device_warning_standard_delay[index] * (device_warning_standard_delay_persent[index]/100))) {

            // 알람값 기준치 이상시 저장하는 로직 (카운팅 갯수가 기준값*비율 보다 크면 데이터 저장)
            app.locals.send_alarm_each_device_value =
            {
              "group_name": app.locals.group_name,
              "device_name": device_name[index],
              "confirm": "false",
              "group_sub_serialnumbers": app.locals.serialnumbers,
              "alarm_value": _.max(alarm_total_counting_arr[index]),
              "record_date": moment(new Date().getTime()).format("YYYY-MM-DD HH:mm:ss"),
              "created_date": new Date().getTime()
            };
            send_alarm_data();

            if(group_send_server_delay_time_status_array[index] != "ON"){
              // 푸쉬 발생시 푸쉬 알림 전송 중지 시간
              group_send_server_delay_time_interval[index] = setInterval(function () {
                // 푸쉬 발생시 상태값 저장
                group_send_server_delay_time_status_array[index] = "ON";
                // 푸쉬 발생시 지정시간동안 카운트 1초씩 감산
                group_send_server_delay_time_array[index] = group_send_server_delay_time_array[index] - 1000;
                // 푸쉬 대기 시간이 종료 되면 (지정된 시간이 종료되면) 푸쉬를 다시 사용 할 수 있게끔 하기.
                if(group_send_server_delay_time_array[index] <= 0){
                  group_send_server_delay_time_status_array[index] = "OFF";
                  clearInterval(group_send_server_delay_time_interval[index]);
                  group_send_server_delay_time_array[index] = app.locals.group_send_server_delay_time;
                }
              }, 1000);
              // console.log(index, "[이상] 워닝워닝워닝워닝워닝워닝워닝 푸쉬알림전송")

              // 푸쉬 부분 (언어 적용)
              if(app.locals.group_translate == 'korean'){
                push_title = "경보상태 : 주의";
                push_body = "장소 : " + app.locals.group_name + " / 이름 : " + device_name[index] + " / 수치 : " + _.max(alarm_total_counting_arr[index]) + "PPS";
                push_color = "#ff1744";
                send_alarm_push();
              } else if(app.locals.group_translate == 'malaysian'){
                push_title = "Alert state : WARNING";
                push_body = "Site : " + app.locals.group_name + " / Name : " + device_name[index] + " / Value : " + _.max(alarm_total_counting_arr[index]) + "PPS";
                push_color = "#ff1744";
                send_alarm_push();
              } else if(app.locals.group_translate == 'english'){
                push_title = "Alert state : WARNING";
                push_body = "Site : " + app.locals.group_name + " / Name : " + device_name[index] + " / Value : " + _.max(alarm_total_counting_arr[index]) + "PPS";
                push_color = "#ff1744";
                send_alarm_push();
              }



            }
          } else {
            console.log("워닝 알람 둘다 해당 안됨")
          }
        }

        // 넷, 배열 초기화
        alarm_total_counting_arr[index] = new Array();
      }
    }
  });
});



////////////////////////////실시간 데이터 데이터베이스 전송 및 푸쉬 언어 선택 로직////////////////////////////








////////////////////////////////////////실시간 데이터 데이터베이스 전송 로직////////////////////////////////////////

// 서버에 알람 데이터 전송 로직 (즉시)
function send_alarm_data(){
  Device_alarm(app.locals.send_alarm_each_device_value).save(function(err,data){
    if (err) throw err;
    tcpp.probe(app.locals.host_name, app.locals.host_port, function(err, available) {
      if(available == false) {
        console.log("주서버 이용 불가능", available);
      } if(available == true) {
        console.log("주서버 이용 가능", available);
        // 서버 확인 처리
        var options = {
          host: app.locals.host_name,
          path: '/remote_get_alarm',
          port: app.locals.host_port,
          method: 'POST'
        };
        var putData = JSON.stringify(data);
        function readJSONResponse(response) {
          var responseData = '';
          response.on('data', function (chunk) {
            responseData += chunk;
            // 데이터 버퍼로 만든 후 전송
          });
          response.on('end', function () {
            var dataObj = JSON.parse(responseData);
            // 데이터 수신
            //console.log(dataObj)  // {status:"ok"}
          });
        }
        var req = http_send.request(options, readJSONResponse);
        req.write(putData);
        req.end();
      }
    });
  });
};

////////////////////////////////////////실시간 데이터 데이터베이스 전송 로직////////////////////////////////////////








////////////////////////////////////////최소 평균 최대 전송 로직////////////////////////////////////////////


// 서버에 트랜드 데이터 전송 로직 (1시간 간격의 최소, 평균, 최대)
var alarm_total_arr = new Array();

// 경보 로직 처리를 위한 배열 (전체 갯수에서 비율로 카운팅하는 로직)
var alarm_total_counting_arr = new Array(); // 알람 체크 & 전송 로직



// 알람 어레이 전체를 담는 어레이 만들기 (1차원배열)
function alarm_total_arr_start(){
  for(var i=0; i < get_modbus_after_array.length; i++) {
    alarm_total_arr[i] = new Array();
    alarm_total_counting_arr[i] = new Array(); // 알람 체크 & 전송 로직
  }
}

// 전체알람 어레이에 담기는 개별 장치의 어레이 만들기 (2차원배열)
// 장치 갯수 만큼 어레이를 만들고 그안에 각 장치의 알람값을 닮음 (ex 전체 2개 장치 일떄 -> [[4,1,5,2], [3,4,2,2]])
function alarm_total_arr_get(){
    _.each(get_modbus_after_array, function (element, index, list) {
      alarm_total_arr[index].push(Number(element));
      // 알람 체크 & 전송 로직 시작
      alarm_total_counting_arr[index].push(Number(element)); // 알람 체크 & 전송 로직
      app.locals.alarm_total_arr_data_process = "1";
    });

    //console.log('alarm_total_counting_arr ', alarm_total_counting_arr);
}

// get_modbus_after_array 에 데이터가 담기는 순간 시작
watch(app.locals, "get_modbus_after_array_start", function(prop, action, newvalue, oldvalue){
  alarm_total_arr_start();
});


// alarm_total_arr 에 모든 개별 장치 배열이 담기는 순간 시작 (즉, alarm_total_arr[index].push(element) 다 담긴 순간 시작)
watch(app.locals, "alarm_total_arr_data_process", function(prop, action, newvalue, oldvalue){
  alarm_total_arr_data_process();
  // 알람 체크 & 전송 로직 시작
  main_check_task.start();
});



////////////////////////////////////////////////////////////////////////////////////////////////
function sum(arr) {
  return _.reduce(arr, function(memo, num) { return memo + num}, 0);
}

function average(arr) {
  return sum(arr) / arr.length;
}
////////////////////////////////////////////////////////////////////////////////////////////////

// # ┌────────────── second (optional) /cron.schedule('*/5 * * * * *', function(){
// # │ ┌──────────── minute
// # │ │ ┌────────── hour
// # │ │ │ ┌──────── day of month
// # │ │ │ │ ┌────── month
// # │ │ │ │ │ ┌──── day of week
// # │ │ │ │ │ │
// # │ │ │ │ │ │
// # * * * * * *

// cron 변수
var alarm_total_arr_data_task;

// 최대,평균,최소 로직 (평균값 소수점이하 절하)
function alarm_total_arr_data_process(){
  // 최초 스캐쥴 시작
  alarm_total_arr_data_task = cron.schedule(app.locals.group_trend_send_time, function(){
    console.log('on')
    _.each(get_modbus_after_array, function (element, index, list) {
      var alarm_MAM_save_go = {
        device_name :  device_name[index],
        confirm: "false",
        group_sub_serialnumbers: app.locals.serialnumbers,
        alarm_min_value: _.min(alarm_total_arr[index]),
        alarm_avg_value: Math.floor(average(alarm_total_arr[index])),
        alarm_max_value: _.max(alarm_total_arr[index]),
        record_date: moment(new Date().getTime()).format("YYYY-MM-DD HH:mm:ss"),
        created_date: new Date().getTime()
      };
      var before_MAM_data = new Device_data(alarm_MAM_save_go);
      before_MAM_data.save(function (err, before_MAM_data) {
        if (err) throw err;
        // 보내고 배열 초기화
        alarm_total_arr[index] = new Array();
      });
    });
  });
  // 이후 스캐쥴 시작 (값이 바뀌었을 때, destroy 걸고 새로 다시 작업 넣어 주기)
  watch(app.locals, "group_trend_send_time", function(prop, action, newvalue, oldvalue){
    if(alarm_total_arr_data_task){
      alarm_total_arr_data_task.destroy();
    }
    alarm_total_arr_data_task = cron.schedule(app.locals.group_trend_send_time, function(){
      _.each(get_modbus_after_array, function (element, index, list) {
        var alarm_MAM_save_go = {
          device_name :  device_name[index],
          confirm: "false",
          group_sub_serialnumbers: app.locals.serialnumbers,
          alarm_min_value: _.min(alarm_total_arr[index]),
          alarm_avg_value: Math.floor(average(alarm_total_arr[index])),
          alarm_max_value: _.max(alarm_total_arr[index]),
          record_date: moment(new Date().getTime()).format("YYYY-MM-DD HH:mm:ss"),
          created_date: new Date().getTime()
        };
        var before_MAM_data = new Device_data(alarm_MAM_save_go);
        before_MAM_data.save(function (err, before_MAM_data) {
          if (err) throw err;
          // 보내고 배열 초기화
          alarm_total_arr[index] = new Array();
        });
      });
    });
  });
}





////////////////////////////////////////최소 평균 최대 전송 로직////////////////////////////////////////////








////////////////////////////////////////////푸쉬 토큰////////////////////////////////////////////


// 토큰 어레이
var registrationToken_before_array = [];
var registrationToken_after_array = [];
var registrationToken_array_last = [];

// 최초 디비데이터 불러와서 적용하기 (최초 서버 실행시 토큰 정보 저장)
User.find({'devices.group_sub_serialnumbers': app.locals.serialnumbers}, function(err,data){
  for(var i=0; i < data.length; i++) {
    // 1. 회원 데이터를 저장하고
    registrationToken_before_array.push(data[i]);
    // 2. 그 회원 데이터중 토큰들을 하나씩 배열에 넣고
    var token_variable = registrationToken_before_array[i].tokens;
    for(var x=0; x < token_variable.length; x++) {
      // 3. 그 토큰들이 있는 배열중에 순수 토큰만 다시 배열에 최종으로 넣는다
      registrationToken_after_array.push(token_variable[x].token);
      registrationToken_array_last = _.union(registrationToken_after_array);
    }
  }
});


// 접속 확인 후 디비데이터 다시 불러와서 적용하기 (서버로 요청받을 때 토큰 정보 다시 저장)
app.post('/push_local_device_connect', urlencodedParser, function(req, res){
  // 토큰 가공 어레이 (어레이에 재 할당 해주는 것이 안되서 만든 새로운 _after 어레이)
  var registrationToken_before_array_after = [];
  var registrationToken_after_array_after = [];
  User.find({'devices.group_sub_serialnumbers': app.locals.serialnumbers}, function(err,data){
    for(var i=0; i < data.length; i++) {
      // 1. 회원 데이터를 저장하고
      registrationToken_before_array_after.push(data[i]);
      // 2. 그 회원 데이터중 토큰들을 하나씩 배열에 넣고
      var token_variable = registrationToken_before_array_after[i].tokens;
      for(var x=0; x < token_variable.length; x++) {
        // 3. 그 토큰들이 있는 배열중에 순수 토큰만 다시 배열에 최종으로 넣는다
        registrationToken_after_array_after.push(token_variable[x].token);
      }
      // 토큰 가공 어레이 (어레이에 재 할당 해주는 것이 안되서 만든 새로운 _after 어레이)
      // 아래와 같이 오른쪽것을 기존의 array 에 넣어줘야 기존 배열이 초기화가 됨.
      registrationToken_after_array = registrationToken_after_array_after;
      registrationToken_array_last = _.union(registrationToken_after_array);
    }
  });
});

app.post('/check_device_by_id', urlencodedParser, function(req, res) {
    
      master.readHoldingRegisters(Number(req.body.id), 0, 2).then((data) => {
        res.status(200).json({data: data, id: req.body.id}); 
      }, (err) => { 
        res.status(200).json({err: err}); 
      });     
  
});

app.get('/sync_date', urlencodedParser, function(req, res){
   
  res.status(200).json({status:"ok"});

  setTimeout(function() {

    var options = {
        host: app.locals.host_name,
        path: '/api_date',
        port: 8500,
        method: 'GET'
    };

    var dataObj = '';
      function readJSONResponse(response) {
        var responseData = '';
        response.on('data', function (chunk) {
          responseData += chunk; 
        });

        response.on('end', function () {
          var dataObj = JSON.parse(responseData); 

          cmd.run("sudo date -s '" + dataObj.date + "'");

        }); 
      } 

      var req = http_send.request(options, readJSONResponse);
      req.write(dataObj);
      req.end(); 

    }, 1000); 
});


app.get('/check_date', urlencodedParser, function(req, res){
  var data = moment(new Date().getTime()).format("YYYY-MM-DD HH:mm:ss");
  res.status(200).json({status:"ok", data: data}); 
});

// // console 테스트
// setInterval(function() {
//   console.log(registrationToken_after_array)
//   console.log(registrationToken_array_last)
// }, 3000);


// 알람값에 따른 푸쉬전송 로직 (고객에 따라 설정되어있는 시간)
function send_alarm_push(){
  // 토큰에 어떤 값이라도 있을 때만 전송
  if(registrationToken_array_last[0]){
    var payload = {
      notification: {
        title: push_title,
        body: push_body,
        sound:"default",
        // icon: 'stock_ticker_update',
        color: push_color
      }
    };
    var options = {
      priority: "high"
    };
    admin.messaging().sendToDevice(registrationToken_array_last, payload, options)
    .then(function(response) {
      // console.log("Successfully sent message:", response);
    })
    .catch(function(error) {
      // console.log("Error sending message:", error);
    });
  }

}


////////////////////////////////////////////푸쉬 토큰////////////////////////////////////////////









////////////////////////////////////////////디폴트////////////////////////////////////////////





server.listen(8200, function() {
  console.log('Server listening on port 8200');
});

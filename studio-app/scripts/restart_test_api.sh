#!/usr/bin/env bash
set -eu

# stop any running instance
pkill -f 'api/timetable.js' || true

# start patched API in background and log output
PORT=2034 nohup node api/timetable.js > ./api-timetable.log 2>&1 &
echo "started $!"

sleep 0.7

echo '--- log ---'
# show any recent logs
tail -n 200 ./api-timetable.log || true

echo '== GET all =='
curl -i 'http://localhost:2034/api/timetable' || true

echo ''
echo '== POST create =='
curl -i -X POST 'http://localhost:2034/api/timetable' -H 'Content-Type: application/json' -d '{"grade":"9","className":"A","day":"Monday","timeSlot":"09:00 - 10:00","courseName":"رياضيات","teacherName":"أحمد"}' || true

echo ''
echo '== GET after POST =='
curl -i 'http://localhost:2034/api/timetable' || true

echo ''
echo '== Tail log =='
tail -n 200 ./api-timetable.log || true

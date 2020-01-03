#!/bin/sh

### BEGIN INIT INFO
# Provides:          lextend
# Required-Start:    $syslog $remote_fs $network
# Required-Stop:     $syslog $remote_fs $network
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: TODO
# Description:       TODO
#                    TODO : complete this long desc
### END INIT INFO

APP_DIR="/usr/bin"
NAME=lextend

DAEMON=lextend_webfrontend
DAEMON1=lextend_engine

PIDFILE=/var/run/$DAEMON.pid
PIDFILE1=/var/run/$DAEMON1.pid

DAEMON_NAME=lextend_webfontend
DAEMON_NAME1=lextend_engine

DAEMON_USER=root

. /lib/lsb/init-functions

do_start () {
    log_daemon_msg "Starting $NAME"

    # NOTE : due to a negative EPOCK problem in Flask, the date must be > 2011
    if [ `date +%Y` -lt 2011 ]; then
      date 010100002012
    fi

    nohup $APP_DIR/$DAEMON1 > /dev/null 2>&1 &
    echo $! > $PIDFILE1
    sleep 4

    nohup $APP_DIR/$DAEMON > /dev/null 2>&1 &
    echo $! > $PIDFILE
}
do_stop () {
    log_daemon_msg "Stopping $NAME"
    kill -9 $(cat $PIDFILE)
    kill -9 $(cat $PIDFILE1)
}

case "$1" in
    start|stop)
        do_${1}
        ;;
    restart|reload|force-reload)
        do_stop
        do_start
        ;;
    status)
        echo "Unknown. Use ps to check for sonos related processes."
        ;;
    *)
        echo "Usage: /etc/init.d/$DAEMON_NAME {start|stop|restart|status}"
        exit 1
        ;;
esac
exit 0

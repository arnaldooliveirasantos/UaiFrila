#!/bin/sh
PORT_TO_USE=${PORT:-80}
echo "Subindo Nginx na porta $PORT_TO_USE"
sed -i "s/__PORT__/$PORT_TO_USE/g" /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'

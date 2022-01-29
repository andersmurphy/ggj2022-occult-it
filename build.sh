#!/bin/bash

yarn run build
# Make index.sh load from relative path
sed -i 's/index\./\.\/index\./' docs/index.html 
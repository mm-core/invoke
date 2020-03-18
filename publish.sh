#! /bin/bash
npm version '1.1.'$(date +%Y%m%d%H%M)
npm run build
npm publish --access public

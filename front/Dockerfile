
FROM node:alpine AS ui-build
WORKDIR /srv/app

COPY ./build ./build/

RUN npm install -g serve

CMD ["serve", "-s", "build", "-l", "3000"]
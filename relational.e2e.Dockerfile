FROM node:22.17.1-alpine

RUN apk add --no-cache bash
RUN npm i -g @nestjs/cli typescript ts-node

WORKDIR /usr/src/app

# Copy the full app before installing
COPY . .

# Copy and fix permissions for scripts
RUN chmod +x /opt/wait-for-it.sh
RUN chmod +x /opt/startup.relational.dev.sh
RUN sed -i 's/\r//g' /opt/wait-for-it.sh
RUN sed -i 's/\r//g' /opt/startup.relational.dev.sh

# Install deps after code copy to bust cache
RUN npm install

# Build the app
RUN npm run build

# Add the startup script log marker
RUN echo "✅ Dockerfile layer built with latest startup.relational.dev.sh"

CMD ["/opt/startup.relational.dev.sh"]

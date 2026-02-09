# STAGE 1: Build the Application
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy generic POM first to cache dependencies
COPY pom.xml .
# Download dependencies (this layer will be cached if pom.xml doesn't change)
RUN mvn dependency:go-offline

# Copy the source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# STAGE 2: Create the Runtime Image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the JAR from the build stage
COPY --from=build /app/target/*.jar app.jar

# Create a non-root user for security (Best Practice)
RUN addgroup -S chronouser && adduser -S chronouser -G chronouser
USER chronouser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

# Build Stage
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
# Ensure mvnw is executable
RUN chmod +x mvnw
# Download dependencies (cache layer)
RUN ./mvnw dependency:go-offline
COPY src ./src
# Build the application
RUN ./mvnw clean package -DskipTests

# Run Stage
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# Copy the service account key which is needed for Firebase
COPY src/main/resources/serviceAccountKey.json /app/serviceAccountKey.json

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

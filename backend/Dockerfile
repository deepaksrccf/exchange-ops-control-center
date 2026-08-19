FROM maven:3.9.11-eclipse-temurin-21 AS build

WORKDIR /workspace

COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-jammy

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN groupadd --system exchangeops \
    && useradd \
        --system \
        --gid exchangeops \
        --create-home \
        exchangeops

COPY --from=build \
    /workspace/target/*.jar \
    /app/exchange-ops-backend.jar

RUN chown -R exchangeops:exchangeops /app

USER exchangeops

EXPOSE 8080

ENV JAVA_OPTS=""

ENTRYPOINT ["sh", "-c", \
  "java $JAVA_OPTS -jar /app/exchange-ops-backend.jar"]

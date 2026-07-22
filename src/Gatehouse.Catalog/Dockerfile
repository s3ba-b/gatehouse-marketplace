# Multi-stage build for the Catalog service (issue #11). Build context is the repo
# root (see docker-compose.yml) so this can COPY Gatehouse.ServiceDefaults alongside
# the service itself — mirrors the ProjectReference in Gatehouse.Catalog.csproj.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY nuget.config .
COPY src/Gatehouse.ServiceDefaults/Gatehouse.ServiceDefaults.csproj src/Gatehouse.ServiceDefaults/
COPY src/Gatehouse.Catalog/Gatehouse.Catalog.csproj src/Gatehouse.Catalog/
RUN dotnet restore src/Gatehouse.Catalog/Gatehouse.Catalog.csproj

COPY src/Gatehouse.ServiceDefaults/ src/Gatehouse.ServiceDefaults/
COPY src/Gatehouse.Catalog/ src/Gatehouse.Catalog/
RUN dotnet publish src/Gatehouse.Catalog/Gatehouse.Catalog.csproj \
    --no-restore --configuration Release --output /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app .

EXPOSE 8080
ENTRYPOINT ["dotnet", "Gatehouse.Catalog.dll"]

# How to run

Before running, check the following link to configure OAuth2 credentials for services.  
[Setup the project.](/docs/technical_docs.md#configuration-du-backend)

Once you have configured the backend environment file `.env`, you can run the following command to start the project.

The service will be exposed and accessible on port 80 of your default network interface. You can access it from http://localhost. Make sure you have set the correct `REDIRECT_URI` in the environment file.


```BASH
docker compose up
```

**If it's the first time you run the container.**  
You will need to setup the replica set of the database manually since it's not possible to do it automatically without an orchestrator. [See this issue on the official Mongo docker image repository for a more detailed explanation.](https://github.com/docker-library/mongo/issues/354)

```BASH
docker exec -it area-mongo mongosh --username api --password docker1234 --eval \
    "rs.initiate({ _id: 'rs0', members: [ { _id: 0, host: 'area-mongo:27017' } ] })"
```

> ⚠️  It is mandatory to specify a configuration for `rs.initiate`. Please note that `area-mongo` must reflect the name of the database container. If you don't, the subsequent rebuild of the mongo container will cause the replica set configuration to fail and trigger a `majority read concern` issue since the new hostname generated by Docker for the mongo container will not match the replica set configuration.
# How to rebuild containers

**If you want to start from scratch with a new database, you must first purge the containers and volumes using the following command.** Once done, follow the explanations above to reconfigure the replica set.

```BASH
docker compose down --volumes
```

You can also run this command instead but don't forget to reconfigure the replica set afterwards.

```BASH
docker compose up --build --force-recreate --renew-anon-volumes
```

# Notes

If you encounter `ENOSPC: System limit for number of file watchers reached` errors during the build, run the following command. **Check your system's value before running the `docker compose up` command**.

```BASH
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sysctl -p
```
[This is because Linux does not yet support setting this parameter for different namespaces.](https://docs.docker.com/engine/reference/commandline/run/#sysctl)

If you have this error `strconv.Atoi: parsing "": invalid syntax` when you run `docker compose up`, run the following command.

```BASH
docker compose down --remove-orphans
```
[See this issue on the official Docker repository for a more detailed explanation.](https://github.com/docker/compose-cli/issues/1537)

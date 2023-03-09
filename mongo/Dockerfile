FROM mongo:6.0.3
RUN openssl rand -base64 700 > file.key
RUN chown 999:999 file.key
RUN chmod 400 file.key
CMD [ "--replSet", "rs0", "--keyFile", "file.key" ]

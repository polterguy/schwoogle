# Schwoogle, because Google Sux!

An open source search engine based upon OpenAI, DuckDuckGo, ChatGPT and [AINIRO.IO Magic](https://github.com/polterguy/magic).
To get a functioning version up running, you'll need a Magic Cloudlet, which should be easy to accomplish since it's got
[Docker images](https://hub.docker.com/r/servergardens/magic-backend). To make it easier to configure, you would probably want
to also apply the [Docker image for the frontend](https://hub.docker.com/r/servergardens/magic-frontend).

Notice, you can stuff all code in this repo into the _"/etc/www/"_ folder of your cloudlet's backend, at which point it will
be served through Magic's web-server
 

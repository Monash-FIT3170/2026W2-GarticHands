# GarticHands container workflow. Requires Docker + `make`.
# On Windows without `make`, run the underlying `docker compose ...` commands
# directly (see DOCKER.md for PowerShell equivalents).

COMPOSE := docker compose

.PHONY: build up down restart logs ps shell test clean

build:        ## Build both images
	$(COMPOSE) build

up:           ## Build (if needed) and start in the background
	$(COMPOSE) up -d --build

down:         ## Stop and remove containers
	$(COMPOSE) down

restart:      ## Restart all services
	$(COMPOSE) restart

logs:         ## Follow logs from all services
	$(COMPOSE) logs -f

ps:           ## Show service status
	$(COMPOSE) ps

shell:        ## Open a shell in the server container
	$(COMPOSE) exec server sh

test:         ## Validate config and smoke-test the running server
	$(COMPOSE) config -q && echo "compose config OK"
	$(COMPOSE) exec -T server node -e "require('http').get('http://127.0.0.1:3000/',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{if(r.statusCode!==200)process.exit(1);console.log('server OK:',d)})}).on('error',e=>{console.error(e.message);process.exit(1)})"

clean:        ## Stop, remove containers, local images, and orphans
	$(COMPOSE) down --rmi local --remove-orphans

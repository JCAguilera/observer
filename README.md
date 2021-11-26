<p align="center"><a href="https://observer.jcaguilera.com" target="_blank"><img src="https://static.wikia.nocookie.net/minecraft_gamepedia/images/a/a9/Observer_BE2.png/revision/latest?cb=20170925224438" width="400"></a></p>

<h1 align="center">Observer.js</h1>

Observer.js is a wrapper that allows you to control multiple Minecraft Servers using Socket.io or JavaScript. It's written in TypeScript and based on the best node.js wrapper for Minecraft Servers: [scriptserver by Garrett Cox](https://github.com/garrettjoecox/scriptserver).

Some features are:

- Starts and stops multiple Minecrafts servers.
- Get specific server information such as Online Players and Server Status.
- Send commands to the servers.
- Listen to events such as status changes, user login and logout, and get extra data with each event.
- Connect multiple client apps using Socket.io and simple api key authentication.

> Note that this is a WIP and it was built for my own use. I will try to
> keep this updated in the future.

## Get started

The first thing to do is install Observer.js. It's not in NPM yet, but if it was, you could install it globally like this:

    npm i -g observer
Now just start the server using the command:

    $ observer
and wait for it to generate a `config.js` file. Once is generated, the api key used to connect to the server will show up in the console and also in the config file where you can change it.
### Configuration
To configure Observer just open the generated `config.json`. Sample config:

    {
      "servers": [
        {
          "name": "test-server",
          "type": "paper",
          "path": "PATH_TO_THE_SERVER_FOLDER",
          "jar": "paper.jar",
          "args": ["-Xmx2G"],
          "autostop": 5000,
          "rcon": {
            "host": "localhost",
            "port": 25575,
            "password": "test123"
          }
        }
      ],
      "apiKey": "AUTO_GENERATED_API_KEY",
      "port": 3000
    }
From top to bottom the options are:
- `servers`: An array of specific servers configuration
	- `name`: Unique name for the server
	- `type`: Type of the server (currently only paper supported)
	- `path`: Path to the server folder
	- `jar`: Name of the jar file
	- `args`: Extra arguments for java
	- `autostop`: (Optional) Milliseconds before the server closes if empty.
	- `rcon`: RCON configuration
		- `host`: RCON host
		- `port`: RCON port
		- `password`: RCON password
- `apiKey`: Secret key for client authentication
- `port`: API Server port

## Using a Socket.io Client

TODO

## Using the JavaScript API

    import {ObserverWrapper} from 'observer';
	
	const wrapper = new ObserverWrapper(options);

TODO

## License

Observer is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT) (If this is not ok please let me know, I don't know how to deal with open source licenses 😭)

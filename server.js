
import {Server} from 'http'
import {runInNewContext} from 'vm'
import express from 'express'
import io from 'socket.io'
import jade from 'pug'
import uuid from 'node-uuid'
import {newName} from './lib/names'
import {Chat} from './lib/chat'
import {prompt} from './lib/prompt'

const app 		= express();
const server 	= new Server(app);
const sockets 	= io.listen(server);
const chats		= new Map([['', {reverser: new Map()}]]);
const api		= {
	chat: {
		create(size, topic) {
			const id 	= uuid.v4();
			const chat	= new Chat(id, sockets, size, topic);
			chats.set(id, chat);

			console.log(`Generating chat...`);
			console.log(` chat id: ${id}`);
			console.log(` urls:`);
			for (let i = 0; i < chat.size; i++) {
				console.log(`  http://localhost:8080/${id}/${chat.memberIds[i]}`);
			}
		},
		delete(id) {
			chats.delete(id);
			console.log(`deleted chat "${id}"`);
		}		
	}
};

function startREPL() {
	prompt('>> ', (err, text) => {
		const result = runInNewContext(text, api);
		console.log();
		startREPL();
	});
}

app.set('view engine', 'jade');

app.use(express.static('public'));

app.get('/:chat/:participant', (req, res) => {
	const chat			= chats.get(req.params.chat);
	const index 		= chat ? chat.reverser.get(req.params.participant) : null;
	const {topic} 		= chat;

	res.render('index.jade', {
		topic,
		organization: 'CatBox',
		name: chat.members[index].name,
	});
});

server.listen(process.env.PORT || 8080);

console.log('Enter js here, or type "help()"');

startREPL();




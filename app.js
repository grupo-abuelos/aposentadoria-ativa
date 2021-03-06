const { exec } = require('child_process');
const fs = require('fs');
const data = require('./data.json');
const posts = require('./posts.json');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.set('view engine', 'pug');
app.use('/static', express.static('public'));

app.use(bodyParser.urlencoded({extended: false}));

app.get('/', (req, res) => {
	res.redirect('/register');
});

app.get('/register', (req, res) => {
	res.render('register_form');
});

app.post('/register', (req, res) => {
	const user = req.body;

	user.id = data.currentID;
	user.interesses = [];
	data.currentID += 1;
	data.users.push(user);

	const json = JSON.stringify(data);

	fs.writeFileSync('data.json', json);
	res.redirect(`/explanation/${user.id}`);
});

app.get('/explanation/:id', (req, res) => {
	const id = req.params.id;
	const user = data.users.find(user => user.id == id);

	if (!user) {
		res.status(404);
		return res.render('not_found');
	}

	res.render('explanation', { user });
});

app.get('/interests', (req, res) => {

});

app.get('/interests/:id', (req, res) => {
	const id = req.params.id;
	const user = data.users.find(user => user.id == id);

	if (!user) {
		res.status(404);
		return res.render('not_found');
	}

	res.render('interests', { user });
});

app.post('/interests/:id', (req, res) => {
	let  updatedUsers;
	const interests = [];
	const id = req.params.id;
	const user = data.users.find(user => user.id == id);

	for (interest in req.body) {
		interests.push(interest);
	}

	interests.map(interest => user.interesses.push(interest));
	user.interesses = interests;
	updatedUsers = data.users.filter(user => user.id != id);
	updatedUsers.push(user);
	data.users = updatedUsers;

	const json = JSON.stringify(data);

	fs.writeFileSync('data.json', json);

	let usrString = `"${user.name}" ${user.datanascimento} ${user.email} ${user.cep}`;
	
	for (let i = 0; i < user.interesses.length; i++) {
		usrString = usrString + ` ${user.interesses[i]}`;
	}

	exec(`gcc backup.c -o backup.o && ./backup.o ${usrString}`, (err, stdout, stderr) => {
		if (err) {
			console.error('There was an error:', err);
			return;
		}

		console.log(`stdout: ${stdout}`)
	});

	res.redirect("/main/" + id);
});

app.get('/main/:id', (req, res)=> {
	const id = req.params.id;
	const user = data.users.find(user => user.id == id);
	const interests = user.interesses;
	const allPosts = posts.posts;
	const userPosts = [];
	const otherPosts = [];

	for (post of allPosts) {
		for (interest of interests) {
			if (post.tags.includes(interest)) {
				userPosts.push(post);
			}
		}
	}

	for (post of allPosts) {
		let isNotIn = true;

		post.tags.forEach(tag => {
			if (interests.includes(tag)) {
				isNotIn = false;
			}
		});

		if (isNotIn) {
			otherPosts.push(post);
		}

	}

	res.render('main', { otherPosts, posts: userPosts });
});

app.listen(3000, () => console.log("Abuelos' app is running on port 3000"));

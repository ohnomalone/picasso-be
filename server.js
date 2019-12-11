import app from './app';
import "@babel/polyfill"

app.set('port', process.env.PORT || 3000);

app.listen(app.get('port'), () => {
	console.log(
		`${app.locals.title} is running on localhost:${app.get('port')}.`
	);
});
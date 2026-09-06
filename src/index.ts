import { Hono } from 'hono'
import { buildDeviceCatalog } from './simulation/application/catalog/DeviceCatalog'

const app = new Hono()

app.get('/', (c) =>
	c.html(`<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Live Audio Simulator</title>
		${import.meta.env.PROD ? '<link rel="stylesheet" href="/static/assets/styles.css" />' : ''}
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="${import.meta.env.PROD ? '/static/client.js' : '/src/client/main.tsx'}"></script>
	</body>
</html>`),
)

app.get('/health', (c) => c.json({ ok: true }))

app.get('/api/devices', (c) => c.json(buildDeviceCatalog()))

export default app

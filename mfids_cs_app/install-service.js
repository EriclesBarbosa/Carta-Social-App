 var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name: 'MFIDS NextJs App', // The name of your service in Windows
  description: 'The web server for the MFIDS CS application.',
  // The script to run. We point directly to the Next.js CLI command.
  script: 'C:\\Projetos\\mfids_cs_app\\node_modules\\next\\dist\\bin\\next',
  scriptOptions: 'start -p 4000' // The arguments to start the app on port 4000
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function () {
  console.log('Install complete. Starting the service...');
  svc.start();
});

// Install the service
svc.install();
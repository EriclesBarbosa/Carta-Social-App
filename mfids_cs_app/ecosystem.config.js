module.exports = {
  apps: [{
    name: 'app-mfids',
    script: ".next/standalone/server.js",
    cwd: 'C:/Projetos/mfids_cs_app',
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
      API_URL: "http://backendcartasocial.dgis.gov.cv"
    }
  }]
}
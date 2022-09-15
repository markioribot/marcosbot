const { TOKEN, PREFIX } = require("./config.json")


const http = require("http");
const express = require("express");
const app = express();
var server = http.createServer(app);
const fetch = require("node-fetch");
const discord = require("discord.js");
const prefix = PREFIX
const client = new discord.Client();
const fs = require("fs");
const bodyParser = require("body-parser");

app.use(express.static("public"));

app.use(bodyParser.json());

let count = 0;
let invcount = 0;
let user = 0;
let rounds = 0;

setInterval(function() {
  let database = JSON.parse(fs.readFileSync("./link.json", "utf8"));
  count = 0;
  invcount = 0;
  user = database.length;
  rounds++;

  database.forEach(m => {
    m.link.forEach(s => {
      count++;

      fetch(s).catch(err => {
        invcount++;
      });
    });
  });
  console.log("Intervalo :)")
    client.user.setActivity({ type: "WATCHING", name: `!m monitor, !m stats, !m remove | Monitorando ${count} Bots` });
}, 240000);

app.get("/", async (request, response) => {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end(
    `Monitorando ${count} bots e ${invcount} Invalido bot com ${user} Users, Buscar numero : ${rounds}`
  );
});

const listener = server.listen(2022, function() {
  console.log(`Seu aplicativo está escutando na porta ` + listener.address().port);
});


client.on("ready", () => {
    console.log(`${client.user.tag} Está pronto.`)
    const server = client.voice.connections.size
    client.user.setActivity({ type: "WATCHING", name: `!m monitor, !m stats, !m remove | Monitorando ${count} Bots` })
})

client.on("message", async message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content
    .slice(prefix.length)
    .trim()
    .split(" ");
  const command = args.shift().toLowerCase();
  // the rest of your code

  if (command == "monitor") {
    if (!args[0]) {
      return send("Forneça o link do bot para monitorar", message, "RED");
    }

    if (!isURL(args[0])) {
      return send(
        "Dado que o URL é inválido, certifique-se de enviar um URL funcional",
        message,
        "RED"
      );
    }

    let database = JSON.parse(fs.readFileSync("./link.json", "utf8"));

    const check = database.find(x => x.id === message.author.id);

    if (check) {
      if (check.link.length === 5) {
        return send(
          "Você atingiu seu limite, não é possível adicionar mais de 5 Bots.",
          message,
          "YELLOW"
        );
      }

      let numb = database.indexOf(check);
      database[numb].link.push(args[0]);
    } else {
      database.push({
        id: message.author.id,
        name: message.author.username,
        link: [args[0]]
      });
    }

    fs.writeFile("./link.json", JSON.stringify(database, null, 2), err => {
      if (err) console.log(err);
    });

    send("Adicionou seu Bot para monitoramento", message, "YELLOW");

    message.delete();
  } else if (command === "stats") {
    let data = JSON.parse(fs.readFileSync("./link.json", "utf8"));

    if (!data) return send("Something went wrong...", message, "YELLOW");

    data = data.find(x => x.id === message.author.id);

    if (!data) {
      return send(
        "Você não tem nenhum Bot para monitorar, use `!m Monitor` para adicionar um Bot",
        message,
        "YELLOW"
      );
    }

    let embed = new discord.MessageEmbed()
      .setAuthor(`Você Tem ${data.link.length} Bots`)
      .setColor("GREEN")
      .setDescription(
        `**:white_check_mark: ${data.link.join("\n\n:white_check_mark: ")}**`
      );

    message.reply("Verifique sua Dm 😊");
    message.author.send(embed).catch(err => {
      return message.channel.send(
        "Sua dms está desabilitado, por favor, habilite para obter estatísticas"
      );
    });
  } else if (command === "remove") {
    let database = JSON.parse(fs.readFileSync("./link.json", "utf8"));
    if (!database) return send("Algo deu errado...", message, "YELLOW");

    let data = database.find(x => x.id === message.author.id);

    if (!data) {
      return send(
        "Você não tem nenhum site para monitorar, use `!Monitor` para adicionar um site",
        message,
        "YELLOW"
      );
    }
    let value = database.indexOf(data);
    let array = [];
    database[value].link.forEach((m, i) => {
      array.push(`**[${i + 1}]**: \`${m}\``);
    });

    let embed = new discord.MessageEmbed()
      .setTitle("Enviar O número do link a ser removido")
      .setColor("BLUE")
      .setDescription(array.join("\n"));

    const msg = await message.channel.send(embed);

    let responses = await message.channel.awaitMessages(
      msg => msg.author.id === message.author.id,
      { time: 300000, max: 1 }
    );
    let repMsg = responses.first();

    if (!repMsg) {
      msg.delete();
      return send(
        "Cancelado O processo de exclusão do bot do monitor.",
        message,
        "RED"
      );
    }

    if (isNaN(repMsg.content)) {
      msg.delete();
      return send(
        "Cancelado o processo de exclusão do bot do monitor devido a ** dígito inválido **",
        message,
        "RED"
      );
    }

    if (!database[value].link[parseInt(repMsg.content) - 1]) {
      msg.delete();
      return send("Não existe nenhum link com este número.", message, "RED");
    }

    if (database[value].link.length === 1) {
      delete database[value];

      var filtered = database.filter(el => {
        return el != null && el != "";
      });

      database = filtered;
    } else {
      delete database[value].link[parseInt(repMsg.content) - 1];

      var filtered = database[value].link.filter(el => {
        return el != null && el != "";
      });

      database[value].link = filtered;
    }

    fs.writeFile("./link.json", JSON.stringify(database, null, 2), err => {
      if (err) console.log(err);
    });

    repMsg.delete();
    msg.delete();

    return send(
      "Removido o site do monitoramento, você pode verificar o site usando `!m Stats`",
      message,
      "GREEN"
    );
  }
});

client.login(TOKEN);

function isURL(url) {
  if (!url) return false;
  var pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
    "((\\d{1,3}\\.){3}\\d{1,3}))|" + // OR ip (v4) address
    "localhost" + // OR localhost
    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
    "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // fragment locator
  return pattern.test(url);
}

//--------------------------------------------------- F U N C T I O N S ---------------------------------------------

function send(content, message, color) {
  if (!color) color = "GREEN";

  return message.channel.send({
    embed: { description: content, color: color }
  });
}

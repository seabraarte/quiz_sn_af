let perguntasSelecionadas = [];
let nPerguntasSelecionadas = 10;
let sortearPerguntas = true;
let embaralharAlternativas = true;
let revelarTodasAsRespostas = false;

async function carregarQuiz() {

    const response = await fetch("questions/questions.json");

    const todasPerguntas = await response.json();
	
	if(sortearPerguntas)
		perguntasSelecionadas =
			shuffle(todasPerguntas).slice(0, nPerguntasSelecionadas);
	else{
		perguntasSelecionadas =
        todasPerguntas.slice(0, nPerguntasSelecionadas);
	}
    renderizarPerguntas();
}

function renderizarPerguntas() {

    const container = document.getElementById("quiz");

    container.innerHTML = "";

    perguntasSelecionadas.forEach((pergunta, indice) => {

        const div = document.createElement("div");

        div.className = "question";

       let html = `
		    <h3>${indice + 1}. ${pergunta.question}</h3>
		`;
		
		if(pergunta.image){
			html += `
				<img src="./questions/imgs/${pergunta.image}.jpg"><br><br>
			`;
		}
        const opcoesEmbaralhadas =
		embaralharAlternativas
			? shuffle(pergunta.options)
			: pergunta.options;

		opcoesEmbaralhadas.forEach((opcao, opcaoIndice) => {

			const tipo =
				pergunta.type === "multiple"
				? "checkbox"
				: "radio";
			
			const checked = 
				revelarTodasAsRespostas &&
				pergunta.correct_answers.includes(opcao)
					? "checked"
					: "";
			
			html += `
				<label>
					<input
						type="${tipo}"
						name="q${indice}"
						value="${opcao}"
						${checked}>
					<span>${opcao}</span>
				</label>
				<br>
			`;
		});

		html += `
		    <button
		        type="button"
		        class="btnIA"
		        onclick="perguntarIA(${pergunta.question, opcoesEmbaralhadas})">
		        	Perguntar à IA
		    </button>
		
		    <br><br>
		`;

        div.innerHTML = html;

        container.appendChild(div);

    });
	document.getElementById("btnFinalizar").style.display = "block";
}

function shuffle(array) {

    const arr = [...array];

    for (let i = arr.length - 1; i > 0; i--) {

        const j = Math.floor(
            Math.random() * (i + 1)
        );

        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
}

function corrigirQuiz() {
	//document.getElementById("quiz").style.display = "none";
	let pontos = 0;

    let resultadoHTML = `
        <h2>Resultado</h2>
    `;

    perguntasSelecionadas.forEach((pergunta, indice) => {

        const marcadas = [];

        document
            .querySelectorAll(`[name="q${indice}"]:checked`)
            .forEach(el => {
                marcadas.push(el.value);
            });

        const usuario =
            [...marcadas]
                .sort()
                .join("|");

        const correto =
            [...pergunta.correct_answers]
                .sort()
                .join("|");

        const acertou = usuario === correto;

        if (acertou) {
            pontos++;
        }

        resultadoHTML += `
    <div class="${acertou ? "correct" : "wrong"}">

        <h3>${indice + 1}. ${pergunta.question}</h3>

        <p>
            ${acertou ? "✔ Acertou" : "✘ Errou"}
        </p>

        ${
            !acertou
            ? `
                <p>
                    <strong>Sua resposta:</strong>
                    ${
                        marcadas.length > 0
                        ? marcadas.join(", ")
                        : "(nenhuma resposta)"
                    }
                </p>
              `
            : ""
        }

        <p>
            <strong>Gabarito:</strong>
            ${pergunta.correct_answers.join(", ")}
        </p>

    </div>

    <hr>
`;
    });

    resultadoHTML =
        `
        <h2>
            Pontuação: ${pontos}/${perguntasSelecionadas.length}
        </h2>
        `
        + resultadoHTML;

    document.getElementById("resultado").innerHTML = resultadoHTML;
	document.getElementById("btnFinalizar").style.display = "none";
	document.getElementById("btnReiniciar").style.display = "block";
}

document
    .getElementById("btnFinalizar")
    .addEventListener("click", corrigirQuiz);

document
    .getElementById("btnReiniciar")
    .addEventListener("click", reiniciarQuiz);

function toggleTheme(){

    const current =
        document.documentElement.getAttribute("data-theme");

    if(current === "dark"){

        document.documentElement.removeAttribute("data-theme");

        localStorage.setItem("theme","light");

    }else{

        document.documentElement.setAttribute(
            "data-theme",
            "dark"
        );

        localStorage.setItem("theme","dark");
    }
}

(function(){

    const saved =
        localStorage.getItem("theme");

    if(saved === "dark"){

        document.documentElement.setAttribute(
            "data-theme",
            "dark"
        );
    }

})();

async function iniciarProva(){
    nPerguntasSelecionadas =
        parseInt(
            document.getElementById(
                "numPerguntas"
            ).value
        );
	if(nPerguntasSelecionadas <= 0){
		return;
	}
    embaralharAlternativas =
        document.getElementById(
            "embaralharAlternativas"
        ).checked;

    document.getElementById(
        "config"
    ).style.display = "none";

    await carregarQuiz();
}

function reiniciarQuiz(){

    perguntasSelecionadas = [];

    document.getElementById("quiz").innerHTML = "";

    document.getElementById("resultado").innerHTML = "";

    document.getElementById("config").style.display = "block";
	
	document.getElementById("btnReiniciar").style.display = "none";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}

function perguntarIA(pergunta, alternativas) {

  const letras = ["A", "B", "C", "D", "E", "F"];

  const textoAlternativas = alternativas
    .map((alt, i) => `${letras[i]}) ${alt}`)
    .join("\n");

  const prompt = `
Você é um ServiceNow Certified System Administrator expert.

Analise a questão da prova de certificação e responda de forma didática.

Question:
${pergunta}

Options:
${textoAlternativas}

Instruções:
1. Identifique a resposta correta.
2. Explique por que ela está correta.
3. Explique por que as outras opções estão incorretas.
4. Mantenha a explicação concisa e focada no exame CSA.
5. Se possível, traga referências de Youtube para estudar.

Retorne a resposta neste formato:

Resposta correta: <letra>

Explicação:
<sua explicação>
`;

	if (pergunta.type === "multiple") {
	    prompt += "\nThis question may have multiple correct answers.";
	}

  const url =
    "https://chatgpt.com/?q=" +
    encodeURIComponent(prompt);

  window.open(url, "_blank");
}

document
	.getElementById("btnIniciar")
	.addEventListener(
		"click",
		iniciarProva
	);

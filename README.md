# Monitor do novo coronavírus nos estados

Este repositório contém os dados e o código fonte por trás dos gráficos [desta reportagem](https://www.estadao.com.br/infograficos/saude,monitor-do-novo-coronavirus-nos-estados,1086213), que compara a evolução dos casos de covid-19 nos 27 estados do Brasil.

Os dados desta matéria foram compilados pela equipe de voluntários do [Brasil.io](https://brasil.io). No diretório `data` está uma cópia destes dados, baixada no dia 30.03.2020.

Os gráficos são gerados pelo programa em JavaScript que está disponível no diretório `scripts`. 

Os estilos customizados estão disponíveis no diretório `styles`. 

Em `include`, estão arquivos .php que contém a estrutura HTML do monitor e dos pequenos-múltiplos de cada região.

Para reproduzir o monitor, é necessário rodar um servidor PHP local no diretório do repositório.
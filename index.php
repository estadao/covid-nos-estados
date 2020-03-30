<head>


	<title>Estadão - Monitor do novo coronavírus nos estados</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link rel="stylesheet" href="styles/style.css">
	<link href="https://fonts.googleapis.com/css?family=Lato:400,400i,900" rel="stylesheet">

</head>

<body>

	<?php

		include 'include/monitor.php';

		include 'include/sul.php';

		include 'include/sudeste.php';

		include 'include/centro-oeste.php';

		include 'include/nordeste.php';

		include 'include/norte.php';

	?>

	<!-- D3.js -->
	<script src="https://d3js.org/d3.v5.min.js"></script>
	<!-- Dataviz -->
	<script src="scripts/script.js"></script>

</body>

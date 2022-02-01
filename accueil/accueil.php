<?php
session_start();
require("../php/check_ok.inc.php");
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accueil FMP</title>
    <link rel="stylesheet" href="../css/style.css"> 
    <link rel="shortcut icon" type="image/x-icon" href="favicon.ico">
    <script type="text/javascript" src="../js/utils.js"></script>
    <script type="text/javascript" src="../js/graph.js"></script>
    <script type="text/javascript" src="../js/vols_class.js"></script>
    <script type="text/javascript" src="../js/regulations_class.js"></script>
    <script src="../js/echarts.min.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', async event => {
          let day = "2022-01-01"; // yyyy-mm-dd
					const data = {};
					const year = parseInt(new Date(day).getFullYear());
					const lastyear = parseInt(new Date(day).getFullYear()) - 1;
					
					const nb_week = weeksInYear(new Date(day).getFullYear());
					const nb_week_lastyear = weeksInYear(new Date(day).getFullYear() - 1);
					const nb_week_2019 = weeksInYear(2019);
					const nb = Math.max(nb_week, nb_week_lastyear, nb_week_2019);
					console.log("Nb week: "+nb_week);
					const listWeek = [];
					for (let k=1;k<nb+1;k++) { listWeek.push(k);}
							
					const data_vols_2019 = new weekly_vols(2019);
					await data_vols_2019.init();
					const data_vols_lastyear = new weekly_vols(lastyear);
					await data_vols_lastyear.init();		
					const data_vols_year = new weekly_vols(year);
					await data_vols_year.init();
					show_traffic_graph("res", year, listWeek, data_vols_year.nbre_vols['cta'], data_vols_lastyear.nbre_vols['cta'], data_vols_2019.nbre_vols['cta'], "LFMMCTA");
          const data_regs_2019 = new weekly_regs(2019);
					await data_regs_2019.init();
					const data_regs_lastyear = new weekly_regs(lastyear);
					await data_regs_lastyear.init();		
					const data_regs_year = new weekly_regs(year);
					await data_regs_year.init();
					show_delay_graph("res2", year, listWeek, data_regs_year.delay['cta'], data_regs_lastyear.delay['cta'], data_regs_2019.delay['cta'], "LFMMCTA");
      });
    </script>
</head>
<body>
<?php include("../php/nav.inc.php"); ?>
<div>
    <p class='body'>BIENVENUE !</p>
</div>
<div style="display: flow">
  <div id="res"></div>
  <div id="res2"></div>
</div>
</body>
</html>
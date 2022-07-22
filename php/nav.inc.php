<nav class="navbar" role="navigation" aria-label="main navigation">
	<div class="navbar-brand">
		<a class="navbar-item" href="https://lfmm-fmp.fr">
      <img src="../images/FMP.png" alt="Logo" width="112" height="28">
    </a>

		<a role="button" class="navbar-burger burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
    </a>
	</div>

	<div id="navbarBasicExample" class="navbar-menu">
		<div class="navbar-center"> 
		  <div class="navbar-item has-dropdown is-hoverable">
				<a class="navbar-link" style="background: transparent;">
            Appli
        </a>
				<div class="navbar-dropdown">
          <a class="navbar-item" href="../accueil/accueil.php">
            Accueil
          </a>
          <?php
          if ($_SESSION['login_bureau'] === true) {
            echo '
            <div class="nested navbar-item dropdown">
              <div class="dropdown-trigger">
                <button class="button" aria-haspopup="true" aria-controls="dropdown-menu">
                  <span>Admin</span>
                </button>
              </div>
              <div class="dropdown-menu" id="dropdown-menu" role="menu">
                <div class="dropdown-content">
                  <a class="navbar-item" href="../admin/b2b-admin.php">Admin B2B</a>
                  <a class="navbar-item" href="../admin/confs-admin.php">Admin Confs</a>
                </div>
              </div>
            </div>';
          }
          ?>
         
          <a class="navbar-item upload_button">
            Upload Schema
          </a>
          <!--<hr class="navbar-divider">-->
          <a class="navbar-item" href="../aide/index.php">
            Aide et Tutos
          </a>
					<a class="navbar-item" href="../php/logout.php">
            Logout
          </a>
				</div>
			</div>	
      <div class="navbar-item has-dropdown is-hoverable">
				<a class="navbar-link" style="background: transparent;">
          Secteurs
        </a>
        <div class="navbar-dropdown">
          <a class="navbar-item" href="../ouverture">
            Ouverture
          </a>
          <a class="navbar-item" href="../confs">
            Confs
          </a>
        </div>
      </div>
			<a class="navbar-item" href="../capa">
        Capa
      </a>
      <div class="navbar-item has-dropdown is-hoverable">
				<a class="navbar-link" style="background: transparent;">
            Trafic & reg
        </a>
				<div class="navbar-dropdown">
					<a class="navbar-item" href="../trafic">
            Trafic
          </a>
					<a class="navbar-item" href="../regulations">
            Régulations
          </a>
          <a class="navbar-item" href="../stats-mensuelles">
            Stats mensuelles
          </a>
				</div>
			</div>
			<a class="navbar-item" href="../overload">
        Overload
      </a>
      <!--
			<div class="navbar-item has-dropdown is-hoverable">
				<a class="navbar-link" style="background: transparent;">
            Stats
        </a>

				<div class="navbar-dropdown">
					<a class="navbar-item">
            Hebdo
          </a>
					<a class="navbar-item">
            Mensuelle
          </a>
          <a class="navbar-item">
            Confs
          </a>
				</div>
			</div>
-->
		</div>
	</div>
</nav>
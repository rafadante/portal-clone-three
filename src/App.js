import './App.scss';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import $ from 'jquery';

/*window.addEventListener('load', function () {
  import('./Main.js')
    .then((module) => {
      console.log("loaded")
    });
})*/

function App() {

  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    if (window.confirm("Confirm you want to logout?") == true) {
      const { error } = await supabase.auth.signOut();
    }
  }

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google"
    })
  }

  window["getSession"] = async function () {
    return session;
  }

  window["saveChamber"] = async (name) => {

    const { data, error } = await supabase
      .from('chambers')
      .insert([
        {
          json: window.dataChamber,
          user_id: session.user.id,
          email: session.user.email,
          thumb: window.thumbDataURL,
          tested: false,
          name: name,
          author: session.user.user_metadata.full_name
        },
      ])

    if (error) {
      //console.log(error);
      alert("error when saving!")
    } else {
      //console.log(data);
      alert("chamber saved with success!")
    }

    document.getElementById("loading-parent").style.opacity = "0";
    document.getElementById("loading-parent").style.pointerEvents = "none";

    $("#ui").css("display", "block");
    $(".img").removeClass("image");
    $("#mobile-controls").css("display", "none");
    $("#container").css("filter", "none");

    $("#blocker").css("display", "none");
    $("#blocker").css("pointer-events", "none");
    $("#reticle").css("display", "none");
  }

  window["selectAllChambers"] = async function () {
    let { data: chambers, error } = await supabase
      .from('chambers')
      .select('*')
    return chambers;
  }

  window["deleteChamber"] = async function (id) {

    document.getElementById("loading-parent").style.opacity = "1";
    document.getElementById("loading-parent").style.pointerEvents = "all";

    const { error } = await supabase
      .from('chambers')
      .delete()
      .eq('id', id)

    document.getElementById("loading-parent").style.opacity = "0";
    document.getElementById("loading-parent").style.pointerEvents = "none";
  }

  window["updateChamberPlayedValue"] = async function (id, value) {
    const { data, error } = await supabase
      .from('chambers')
      .update({ played: value})
      .eq('id', id)
      .select()

      //console.log(data)
  }

  window["updateChamber"] = async function (name, id) {
    const { data, error } = await supabase
      .from('chambers')
      .update({
        json: window.dataChamber,
        thumb: window.thumbDataURL,
        tested: false,
        name: name,
      })
      .eq('id', id)
      .select()

    if (error) {
      //console.log(error);
      alert("error when saving!")
    } else {
      //console.log(data);
      alert("chamber saved with success!")
    }

    document.getElementById("loading-parent").style.opacity = "0";
    document.getElementById("loading-parent").style.pointerEvents = "none";
  }

  window["updateChamberFinishedValue"] = async function (id, value) {

    const { data, error } = await supabase
      .from('chambers')
      .update({ finished: value, tested: true })
      .eq('id', id)
      .select()
  }

  if (!session) {
    return (
      <>
        {/**(<Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />) */}
        <div id='login-page'>

          <div id="login-back"></div>

          <img src="./assets/ui/logo2.png"></img>
          <span>Registration is required to access the project!!</span>

          <button type="button" class="login-with-google-btn" onClick={signIn}>
            Sign in with Google
          </button>
        </div>

      </>
    )
  }
  else {

    import('./Main.js')
      .then((module) => {
        console.log("loaded")
      });

    return (
      <div className="App">
        <Analytics />
        <SpeedInsights />

        <div id='alert'>
          <span>AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA</span>
        </div>

        <div style={{
          backgroundImage: "url(./assets//Captura\ de\ tela\ 2024-12-20\ 165453.png)",
          backgroundSize: "contain",
          width: "100%",
          height: "100%",
          position: "absolute",
          zIndex: "10000000",
          opacity: "0.0",
          pointerEvents: "none"
        }}></div>

        <div id="container" style={{ backgroundColor: "#d3d0d0", position: "fixed" }}>
          <div id="back-effect"></div>
        </div>

        <div id="reticle">
          <img alt="image" id="reticle-img" width="50" src="../assets/textures/crosshairNone.webp" ></img>
        </div>

        <div id="ui">

          <div id="audio-trigger">
            <span>You can create voice lines from GLaDOS in this link <a href="https://glados.c-net.org/"
              target="_blank">link</a></span>
            <span>After processing, download the audio and store in <a href="https://www.dropbox.com/home"
              target="_blank">dropbox</a> account</span>
            <span>After that, just share the link and copy in the voice input field.</span>
          </div>

          <div id="tags-menu">
            <span>CHAMBER TAGS</span>
            <div>
              <label htmlFor="tag">Chill</label>
              <input name="tag" type="checkbox"></input>
            </div>
            <div>
              <label htmlFor="tag">Hard</label>
              <input name="tag" type="checkbox" ></input>
            </div>
            <div>
              <label htmlFor="tag">Fast</label>
              <input name="tag" type="checkbox" ></input>
            </div>
            <div>
              <label htmlFor="tag">Long</label>
              <input name="tag" type="checkbox" ></input>
            </div>
            <div>
              <label htmlFor="tag">Remake Portal 1</label>
              <input name="tag" type="checkbox" ></input>
            </div>
            <div>
              <label htmlFor="tag">Remake Portal 2</label>
              <input name="tag" type="checkbox" ></input>
            </div>
            <div>
              <label htmlFor="tag">Original</label>
              <input name="tag" type="checkbox" ></input>
            </div>
          </div>

          <div id="side-bar-left">
            <div id="info-box">
              <h2 id="info-title">Button</h2>
              <h3 id="info-content">Buttons have three variants which can be activated by weight, spheres and cubes. Each
                can be linked to an object to form a trigger. You can pick which type of button to use by selecting the
                corresponding icon on the toolbar or modifying an existing placement through the properties menu.
              </h3>
            </div>
            <button id="arrow-menu">
              <i className="fas fa-chevron-right"></i>
            </button>
            <div className="header">
              <span id="header-items">ITEMS</span>
              <span id="header-settings">SETTINGS</span>
            </div>
            <div className="body">
              <div id="settings">
                <div className="options-row">
                  <span className="option-name" id="">Portal Gun Initiate:</span>
                  <div className="option-value">
                    <select name="portal_gun" id="portal-gun-select">
                      <option value="all" id="all-gun">All Portals</option>
                      <option value="left" id="left-gun">Left Portal</option>
                      <option value="right" id="right-gun">Right Portal</option>
                      <option value="none" id="none-gun">No Portals</option>
                    </select>
                  </div>
                </div>
                <div className="options-row">
                  <span className="option-name" id="">Ambient Sound:</span>
                  <div className="option-value">
                    <select name="ambient_sound" id="ambient-sound-select">
                      <option value="1">Halls Of Science 4</option>
                      <option value="2">9999999</option>
                      <option value="3">Comedy = Tragedy + Time</option>
                      <option value="4">I'm Different</option>
                      <option value="5">Music of the Spheres</option>
                      <option value="6">Overgrowth</option>
                      <option value="7">Technical Difficulties</option>
                      <option value="8">TEST</option>
                      <option value="9">The Courtesy Call</option>
                      <option value="10">The Future Starts With You</option>
                      <option value="11">You are Not Part of the Control Group</option>
                    </select>
                  </div>
                </div>
              </div>
              <div id="items">

                <div>
                  <img alt="image"
                    data-content="A dropper will come with it. If the player loses the cube the dropper will replace it. You can even disable the dropper if you'd like from the properties menu."
                    data-title="CUBE" className="item" data-name="cube" src="../assets/ui/items/cube_pink.webp"
                    data-allowconnection="true" data-rotate="false" data-floor="true" data-ceiling="true" data-walls="false"
                    data-instanced="true" id="cube" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image"
                    data-content="A dropper will come with it. If the player loses the cube the dropper will replace it. You can even disable the dropper if you'd like from the properties menu."
                    data-title="CUBE 2" className="item" data-name="cube_2" src="../assets/ui/items/cube_blue.webp"
                    data-allowconnection="true" data-rotate="false" data-floor="true" data-ceiling="true" data-walls="false"
                    data-instanced="true" id="cube_2" />
                  <span>10</span>
                </div>

                <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <img alt="image" style={{ width: "53px" }}
                    data-content="A dropper will come with it. If the player loses the cube the dropper will replace it. You can even disable the dropper if you'd like from the properties menu."
                    data-title="SCALE CUBE" className="item" data-name="scale_cube" src="../assets/ui/items/scale_cube.webp"
                    data-allowconnection="true" data-rotate="false" data-floor="true" data-ceiling="true" data-walls="false"
                    data-instanced="true" id="scale_cube" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image"
                    data-content="A dropper will come with it. If the player loses the sphere the dropper will replace it. You can even disable the dropper if you'd like from the properties menu."
                    data-title="SPHERE" className="item" data-name="sphere" src="../assets/ui/items/sphere.webp"
                    data-allowconnection="true" data-rotate="false" data-floor="true" data-ceiling="true" data-walls="false"
                    data-instanced="true" id="sphere" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image"
                    data-content="Once the laser emitter hits the catcher you can have it trigger a function such as opening a door, or enabling a set of stairs."
                    data-title="LASER EMITTER" className="item" data-name="laser_emitter" data-allowconnection="true"
                    data-rotate="false" data-floor="true" data-ceiling="true" data-walls="true" data-instanced="true"
                    src="../assets/ui/items/laser_emitter.webp" id="laser_emitter" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image" data-content="Trigger with the laser." data-title="LASER RECEIVER" className="item"
                    data-allowconnection="false" data-rotate="false" data-floor="true" data-ceiling="true" data-walls="true"
                    data-instanced="true" data-name="laser_receiver" src="../assets/ui/items/laser_receiver.webp"
                    id="laser_receiver" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image" data-content="Trigger with the laser." data-title="LASER RELAY" className="item"
                    data-name="laser_relay" data-allowconnection="false" data-rotate="false" data-floor="true"
                    data-ceiling="true" data-walls="true" data-instanced="true" src="../assets/ui/items/laser_relays.webp"
                    id="laser_relay" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image" data-content="Reflects the laser." data-title="LASER CUBE" className="item"
                    data-name="laser_cube" data-allowconnection="true" data-rotate="false" data-floor="true"
                    data-ceiling="true" data-walls="false" data-instanced="true" src="../assets/ui/items/laser_cube.webp"
                    id="laser_cube" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image"
                    data-content="Can be linked to an object to form a trigger. This button only accepts spheres."
                    data-title="BUTTON SPHERE" className="item" data-name="button_sphere" id="button_sphere"
                    data-allowconnection="false" data-rotate="false" data-floor="true" data-ceiling="true" data-walls="true"
                    data-instanced="true" src="../assets/ui/items/button_sphere.webp" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image"
                    data-content="Can be linked to an object to form a trigger. This button only accepts cubes."
                    data-title="BUTTON CUBE" className="item" data-name="button_box" src="../assets/ui/items/button_cube.webp"
                    data-allowconnection="false" data-rotate="false" data-floor="true" data-ceiling="true" data-walls="true"
                    data-instanced="true" id="button_box" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image"
                    data-content="Can be linked to an object to form a trigger. This button accepts spheres and cubes."
                    data-title="BUTTON WEIGHT" className="item" data-name="button_weight" src="../assets/ui/items/button.webp"
                    data-allowconnection="false" data-rotate="false" data-floor="true" data-ceiling="true" data-walls="true"
                    data-instanced="true" id="button_weight" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image"
                    data-content="Can be linked to an object to form a trigger. The player can click on the button and it will activate the function that it is connected to. You can add a timer to your button through the properties menu."
                    data-title="PEDESTAL BUTTON" className="item" data-name="pedestal_button" data-allowconnection="false"
                    src="../assets/ui/items/pedestal_button.webp" data-rotate="true" data-floor="true" data-ceiling="true"
                    data-walls="true" data-instanced="true" id="pedestal_button" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image"
                    data-content="You can link a trigger to it to activate this portal without the need of the portal gun."
                    data-title="PORTAL LEFT" className="item" data-name="portal_0" src="../assets/ui/items/portalBlue.webp"
                    data-allowconnection="true" data-rotate="false" data-floor="true" data-ceiling="true" data-walls="true"
                    data-instanced="true" id="portal_0" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image"
                    data-content="You can link a trigger to it to activate this portal without the need of the portal gun."
                    data-title="PORTAL RIGHT" className="item" data-name="portal_1" src="../assets/ui/items/portalOrange.webp"
                    data-allowconnection="true" data-rotate="false" data-floor="true" data-ceiling="true" data-walls="true"
                    data-instanced="true" id="portal_1" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image" data-content="You can link a trigger to it to open the door." data-title="DOOR"
                    className="item" data-name="door" src="../assets/ui/items/door.webp" data-allowconnection="true"
                    data-rotate="true" data-floor="true" data-ceiling="false" data-walls="false" data-instanced="false"
                    id="door" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image" data-content="" data-title="Spawn Point" className="item" data-name="spawn"
                    src="../assets/ui/items/spawn.webp" data-allowconnection="false" data-rotate="false" data-floor="true"
                    data-ceiling="false" data-walls="false" id="spawn" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image"
                    data-content="Whenever the player walks through a Tractor Beam they will float through the beam it emits. The blue beam pushes the player forward, away from the receptacle, and the orange beam pulls the player in towards it. The properties menu allows you to start the beam in reversed mode or completely off."
                    data-title="TRACTOR BEAM" className="item" data-name="tractor_beam" data-beam="blue" data-rotate="false"
                    data-floor="true" data-ceiling="true" data-walls="true" data-instanced="true" data-allowconnection="true"
                    id="tractor_beam" src="../assets/ui/items/tractor_beam.webp" />
                  <span>10</span>
                </div>

                <div className="">
                  <img alt="image"
                    data-content="Players and objects will not pass through the surface of Light Bridges. Within the properties menu you're given the option to start the bridge enabled or disabled."
                    data-title="LIGHT BRIDGE" className="item" data-name="light_bridge" src="../assets/ui/items/light_bridge.webp"
                    data-floor="true" data-ceiling="true" data-walls="true" data-instanced="true" data-allowconnection="true"
                    id="light_bridge" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image"
                    data-content="Fizzlers destroy any objects which pass through them such as cubes or turrets. If a player walks through a Fizzler any previously placed portals will also be destroyed. You can increase and decrease the size of the Fizzler using the arrows that appear when the object is selected."
                    data-title="FIZZLER" className="item" data-name="fizzler" src="../assets/ui/items/fizzlers.webp"
                    data-floor="true" data-ceiling="true" data-walls="true" data-instanced="true" data-allowconnection="true"
                    id="fizzler" />
                  <span>10</span>
                </div>

                <div className="">
                  <img alt="image"
                    data-content="Glass panels can be placed in your level which the player cannot break. You can increase and decrease the size of the panel by using the arrows that appear when the object is selected. You can change the barrier type to grating within the properties menu which will allow players to place a portal on the other side."
                    data-title="GLASS PANELS" className="item" data-name="glass" src="../assets/ui/items/glass.webp"
                    data-allowconnection="false" data-rotate="false" data-floor="true" data-ceiling="true" data-walls="true"
                    id="glass" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image"
                    data-content="Any contact with the lasers will result in instant death. However, the Field allows objects to pass through without harm."
                    data-title="LASER FIELD" className="item" data-name="laser_field" src="../assets/ui/items/laser_field.webp"
                    data-floor="true" data-ceiling="true" data-walls="true" data-instanced="true" data-allowconnection="true"
                    id="laser_field" />
                  <span>10</span>
                </div>

                <div className="">
                  <img alt="image" data-content="If the player steps in Deadly Goo they will be instantly killed."
                    data-title="DEADLY GOO" data-allowconnection="false" data-rotate="false" data-floor="true"
                    data-ceiling="false" data-walls="false" data-instanced="false" className="item" data-name="goo"
                    src="../assets/ui/items/goo.webp" />
                  <span>10</span>
                </div>

                <img alt="image" data-content="" data-title="ENERGY PELLET LAUNCHER" className="item" data-name="pellet_launcher"
                  data-allowconnection="true" data-rotate="false" data-floor="true" data-ceiling="true" data-walls="true"
                  data-instanced="true" src="../assets/ui/items/pellet_launcher.webp" id="pellet_launcher" />

                <img alt="image" data-content="" data-title="ENERGY PELLET CATCHER" className="item" data-name="pellet_catcher"
                  data-allowconnection="true" data-rotate="false" data-floor="true" data-ceiling="true" data-walls="true"
                  data-instanced="true" src="../assets/ui/items/pellet_catcher.webp" id="pellet_catcher" />

                <div className="">
                  <img alt="image"
                    data-content="If a player walks onto a Faith Plate it will cause them to get bounced into the air. When you place a Faith Plate within the editor it will also create a bullseye and a yellow ball. The Bullseye is where the player will ultimately land, and the yellow ball is the trajectory the player will travel."
                    data-allowconnection="true" data-rotate="true" data-floor="true" data-ceiling="false" data-walls="false"
                    data-instanced="false" data-title="FAITH PLATE" className="item" id="faith_plate" data-name="faith_plate"
                    src="../assets/ui/items/faith_plate.webp" />
                  <span>10</span>
                </div>

                <img alt="image"
                  data-content="Piston Platforms will move up and down whenever the player stands on it. If it is connected to a trigger then the trigger must be activated before it will begin to move. You can adjust the height of the platform using the arrows that appear when the object is selected."
                  data-title="PISTON PLATFORMS" className="item" data-name="piston_platforms" id="piston_platforms"
                  data-allowconnection="true" data-rotate="false" data-floor="true" data-ceiling="false" data-walls="false"
                  src="../assets/ui/items/piston_platforms.webp" />

                <img alt="image"
                  data-content="Track Platforms move on rails. You can adjust the pathing using the arrows that appear when the object is selected. The properties menu allow you to set the rail to oscillate and you can set the platform to start active or disabled."
                  data-title="TRACK PLATFORMS" className="item" data-name="track_platforms" id="track_platforms"
                  data-allowconnection="true" data-rotate="false" data-floor="false" data-ceiling="false" data-walls="true"
                  src="../assets/ui/items/track_platforms.webp" />

                <img alt="image" data-content="You can choose if you want the panel to be automatically deployed or not."
                  data-title="ANGLED PORTAL PANEL" className="item" data-name="angled_panel" data-allowconnection="true"
                  data-rotate="true" data-floor="true" data-ceiling="true" data-walls="true"
                  src="../assets/ui/items/angled_panel.webp" id="angled_panel" data-instanced="false" />

                <div>
                  <img alt="image" data-content="Purely cosmetic." data-title="DESK" className="item" data-name="desk"
                    src="../assets/ui/items/desk.webp" data-allowconnection="false" data-rotate="true" data-floor="true"
                    data-ceiling="false" data-walls="false" data-color="rgb(0,0,255)" id="desk" />
                  <span>5</span>
                </div>

                <div>
                  <img alt="image" data-content="Purely cosmetic." data-title="STEP" className="item" data-name="step"
                    src="../assets/ui/items/step.png" data-allowconnection="false" data-rotate="true" data-floor="true"
                    data-ceiling="false" data-walls="false" data-color="rgb(0,0,255)" id="step" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image"
                    data-content="An area that triggers once the players walks into it, you can link to items just like buttons. You can choose between a one time trigger or a multiple one. You can also change the visibility."
                    data-title="TRIGGER ENTER" className="item" data-name="trigger_area" src="../assets/ui/items/trigger.jpg"
                    data-allowconnection="true" data-rotate="false" data-floor="true" data-ceiling="true" data-walls="true"
                    data-color="rgb(255,127,80)" id="trigger_area" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image"
                    data-content="An area that saves once the players walks into it. You can also change the visibility."
                    data-title="TRIGGER SAVE" className="item" data-name="trigger_save" src="../assets/ui/items/save.jpg"
                    data-allowconnection="false" data-rotate="false" data-floor="true" data-ceiling="true" data-walls="true"
                    data-color="rgb(0,255,0)" id="trigger_save" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image"
                    data-content="An area that plays a voice once the players walks into it. You can also change the visibility."
                    data-title="TRIGGER VOICE" className="item" data-name="trigger_voice" src="../assets/ui/items/voice.jpg"
                    data-allowconnection="true" data-rotate="false" data-floor="true" data-ceiling="true" data-walls="true"
                    data-color="rgb(255,0,0)" id="trigger_voice" />
                  <span>10</span>
                </div>

                <div className="">
                  <img alt="image"
                    data-content="Light Strips are purely cosmetic and provide your map with additional light. You can place four of them on a single square and they can be placed horizontally or vertically."
                    data-title="LIGHT TOP" className="item" data-name="light" src="../assets/ui/items/stripe.webp"
                    data-allowconnection="true" data-rotate="true" data-floor="true" data-ceiling="true" data-walls="true"
                    data-instanced="true" id="light" />
                  <span>10</span>
                </div>

                <div className="">
                  <img alt="image" data-content="Obtainable item: you can define how many portals it will have."
                    data-title="PORTAL GUN" className="item" data-name="portal_gun" src="../assets/ui/items/gun2.webp"
                    data-instanced="true" data-allowconnection="false" data-rotate="true" data-floor="true"
                    data-ceiling="false" data-walls="false" id="portal_gun" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image" data-content="Purely cosmetic, it will play a radio music." data-title="RADIO" className="item"
                    data-name="radio" src="../assets/ui/items/radio.webp" data-allowconnection="false" data-rotate="false"
                    data-floor="true" data-ceiling="true" data-walls="true" data-instanced="true" id="radio" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image" data-content="Purely cosmetic, it will look at the player." data-title="CAMERA"
                    className="item" data-name="camera" src="../assets/ui/items/camera.webp" data-allowconnection="false"
                    data-rotate="false" data-floor="false" data-ceiling="false" data-walls="true" data-instanced="false"
                    id="camera" />
                  <span>10</span>
                </div>

                <div>
                  <img alt="image" data-content="Purely cosmetic." data-title="BED" className="item" data-name="bed"
                    src="../assets/ui/items/bed.png" data-allowconnection="false" data-rotate="true" data-floor="true"
                    data-ceiling="false" data-walls="false" data-color="rgb(0,0,255)" id="bed" />
                  <span>5</span>
                </div>

                <div>
                  <img alt="image" data-content="Purely cosmetic." data-title="TRASH" className="item" data-name="trash"
                    src="../assets/ui/items/trash.png" data-allowconnection="false" data-rotate="true" data-floor="true"
                    data-ceiling="true" data-walls="true" data-color="rgb(0,0,255)" id="trash" />
                  <span>5</span>
                </div>

                <div>
                  <img alt="image" data-content="Purely cosmetic." data-title="TOILET" className="item" data-name="toilet"
                    src="../assets/ui/items/toilet.png" data-allowconnection="false" data-rotate="true" data-floor="true"
                    data-ceiling="false" data-walls="false" data-color="rgb(0,0,255)" id="toilet" />
                  <span>5</span>
                </div>

                <div>
                  <img alt="image" data-content="" data-title="INCINERATOR" className="item" data-name="incinerator"
                    src="../assets/ui/items/incinerator.png" data-allowconnection="true" data-rotate="true" data-floor="true"
                    data-ceiling="false" data-walls="false" data-instanced="true" id="incinerator" />
                  <span>1</span>
                </div>
              </div>
            </div>
          </div>

          <div id="ui-top" className="">
            <div id="top-menu-left">
              <span id="save-level">Save</span>
              <span id="load-level">Load</span>
              <span id="view-fps">Test</span>
              <input id="chamber-name-to-save" type="text" placeholder="Name of the Chamber"></input>
              <span style={{ fontWeight: "normal" }}>by</span>
              <input id="author-name-to-save" type="text" placeholder="Name of the Author"></input>
            </div>
          </div>
        </div>

        <div id="load-level-panel">
          <span id="close-load-level-panel">X</span>
          <input type="file" id="input-level" accept="application/json"></input>
        </div>

        <div id="loading-parent">
          <div id="gallery-img">
            <img alt="image" className="img image" id="back-loading1" src="../assets/loading/3.webp" />
            <img alt="image" className="img image" id="back-loading2" src="../assets/loading/3.webp" />
            <img alt="image" className="img image" id="back-loading3" src="../assets/loading/3.webp" />
          </div>

          <div id="back-effect"></div>
          <section className="hero">
            <h1 style={{ fontSize: "8vh" }} className="main-title">LOADING</h1>
            <p id="p1" className="introduction-text">
              This version is not optimized and may not run well on some devices.
            </p>
            <p id="p2" className="introduction-text loading-disabled">
              If you make graphical changes on the settings you may need to reload the page, there are some presets to choose
              from.
            </p>
            <p id="p3" className="introduction-text loading-disabled">
              There are a total of 10 chambers in this version, your progress will be saved after completing each chamber.
            </p>
            <p id="p4" className="introduction-text loading-disabled">
              Have fun and get your cake at the end!
            </p>
          </section>
          <div className="loading"></div>
        </div>

        <ul className="menu">
          <li id="portalable" className="menu-item noItem">
            <a href="#" className="menu-btn">
              <i className="" style={{ fontWeight: "bolder" }}>P</i>
              <span className="menu-text">Portalable</span>
            </a>
          </li>
          <li id="conection" className="menu-item hasItem buttons">
            <a href="#" className="menu-btn">
              <i className="" style={{ fontWeight: "bolder" }}>C</i>
              <span className="menu-text">Connect to...</span>
            </a>
          </li>
          <li id="delete" className="menu-item hasItem">
            <a href="#" className="menu-btn">
              <i className="" style={{ fontWeight: "bolder" }}>D</i>
              <span className="menu-text">Delete</span>
            </a>
          </li>

          <li id="lines" className="menu-item hasItem buttons" style={{ display: "none !important" }}>
            <a href="#" className="menu-btn">
              <input type="checkbox" defaultChecked id="state-lines" />
              <span className="menu-text">Show Lines</span>
            </a>
          </li>

          <li id="dispenser" className="menu-item hasItem dispenser">
            <a href="#" className="menu-btn">
              <input type="checkbox" defaultChecked id="state-dispenser" />
              <span className="menu-text">Dispenser</span>
            </a>
          </li>
          <li id="rotate-item" className="menu-item noItem">
            <button type="button" className="menu-btn">
              <i className="fa fa-sync-alt"></i>
              <span className="menu-text">Rotate Item</span>
            </button>
          </li>

          {/**/}
          <li id="light-bridge-state" className="menu-item hasItem light-bridge">
            <a href="#" className="menu-btn">
              <input type="checkbox" defaultChecked id="light-bridge-state-input" />
              <span className="menu-text">State</span>
            </a>
          </li>
          <li className="menu-item menu-item-submenu hasItem light-bridge" id="light-bridge-trigger"
            data-trigger="Middle Horizontal">
            <button type="button" className="menu-btn">
              <i className="fa fa-crosshairs"></i>
              <span className="menu-text title">Middle Horizontal</span>
            </button>
            <ul className="menu">
              <li data-trigger="Middle Horizontal" className="menu-item light-bridge-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Middle Horizontal</span>
                </button>
              </li>
              <li data-trigger="Middle Vertical" className="menu-item light-bridge-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Middle Vertical</span>
                </button>
              </li>
              <li data-trigger="Top" className="menu-item light-bridge-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Top</span>
                </button>
              </li>
              <li data-trigger="Bottom" className="menu-item light-bridge-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Bottom</span>
                </button>
              </li>
              <li data-trigger="Left" className="menu-item light-bridge-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Left</span>
                </button>
              </li>
              <li data-trigger="Right" className="menu-item light-bridge-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Right</span>
                </button>
              </li>
            </ul>
          </li>

          {/**/}
          <li className="menu-item menu-item-submenu hasItem laser_emitter" id="laser_emitter-trigger"
            data-trigger="Middle Horizontal">
            <button type="button" className="menu-btn">
              <i className="fa fa-crosshairs"></i>
              <span className="menu-text title">Middle Horizontal</span>
            </button>
            <ul className="menu">
              <li data-trigger="Middle Horizontal" className="menu-item laser_emitter-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Middle Horizontal</span>
                </button>
              </li>
              <li data-trigger="Top" className="menu-item laser_emitter-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Top</span>
                </button>
              </li>
              <li data-trigger="Bottom" className="menu-item laser_emitter-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Bottom</span>
                </button>
              </li>
              <li data-trigger="Left" className="menu-item laser_emitter-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Left</span>
                </button>
              </li>
              <li data-trigger="Right" className="menu-item laser_emitter-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Right</span>
                </button>
              </li>
            </ul>
          </li>

          {/**/}
          <li className="menu-item menu-item-submenu hasItem laser_receiver" id="laser_receiver-trigger"
            data-trigger="Middle Horizontal">
            <button type="button" className="menu-btn">
              <i className="fa fa-crosshairs"></i>
              <span className="menu-text title">Middle Horizontal</span>
            </button>
            <ul className="menu">
              <li data-trigger="Middle Horizontal" className="menu-item laser_receiver-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Middle Horizontal</span>
                </button>
              </li>
              <li data-trigger="Top" className="menu-item laser_receiver-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Top</span>
                </button>
              </li>
              <li data-trigger="Bottom" className="menu-item laser_receiver-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Bottom</span>
                </button>
              </li>
              <li data-trigger="Left" className="menu-item laser_receiver-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Left</span>
                </button>
              </li>
              <li data-trigger="Right" className="menu-item laser_receiver-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Right</span>
                </button>
              </li>
            </ul>
          </li>

          {/**/}
          <li id="plate-state" className="menu-item hasItem faith_plate">
            <a href="#" className="menu-btn">
              <input type="checkbox" defaultChecked id="plate-state-input" />
              <span className="menu-text">State</span>
            </a>
          </li>

          {/**/}
          <li id="grid-state" className="menu-item hasItem glass">
            <a href="#" className="menu-btn">
              <input type="checkbox" id="grid-state-input" />
              <span className="menu-text">Grid</span>
            </a>
          </li>
          <li className="menu-item menu-item-submenu hasItem glass" id="glass-trigger" data-trigger="Left">
            <button type="button" className="menu-btn">
              <i className="fa fa-crosshairs"></i>
              <span className="menu-text title">Left</span>
            </button>
            <ul className="menu">
              <li data-trigger="Middle Horizontal" className="menu-item glass-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Middle Horizontal</span>
                </button>
              </li>
              <li data-trigger="Middle Vertical" className="menu-item glass-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Middle Vertical</span>
                </button>
              </li>
              <li data-trigger="Top" className="menu-item glass-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Top</span>
                </button>
              </li>
              <li data-trigger="Bottom" className="menu-item glass-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Bottom</span>
                </button>
              </li>
              <li data-trigger="Left" className="menu-item glass-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Left</span>
                </button>
              </li>
              <li data-trigger="Right" className="menu-item glass-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Right</span>
                </button>
              </li>
            </ul>
          </li>

          {/**/}
          <li className="menu-item menu-item-submenu hasItem portal_gun" id="portal_gun-state" data-state="all">
            <button type="button" className="menu-btn">
              <i className="fa fa-crosshairs"></i>
              <span className="menu-text title">All Portals</span>
            </button>
            <ul className="menu">
              <li data-state="all" className="menu-item portal_gun-state">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">All Portals</span>
                </button>
              </li>
              <li data-state="left" className="menu-item portal_gun-state">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Only Left Portal</span>
                </button>
              </li>
              <li data-state="right" className="menu-item portal_gun-state">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Only Right Portal</span>
                </button>
              </li>
            </ul>
          </li>

          {/**/}
          <li id="ligh-color" className="menu-item hasItem light-color">
            <a href="#" className="menu-btn">
              <input type="color" id="ligh-color-input" />
              <span className="menu-text">Light Color</span>
            </a>
          </li>

          {/**/}
          <li id="laser-field-state" className="menu-item hasItem laser-field">
            <a href="#" className="menu-btn">
              <input type="checkbox" defaultChecked id="laser-field-state-input" />
              <span className="menu-text">State</span>
            </a>
          </li>
          <li className="menu-item menu-item-submenu hasItem laser-field" id="laser-field-trigger"
            data-trigger="Middle Horizontal">
            <button type="button" className="menu-btn">
              <i className="fa fa-crosshairs"></i>
              <span className="menu-text title">Middle Vertical</span>
            </button>
            <ul className="menu">
              <li data-trigger="Middle Horizontal" className="menu-item laser-field-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Middle Horizontal</span>
                </button>
              </li>
              <li data-trigger="Middle Vertical" className="menu-item laser-field-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Middle Vertical</span>
                </button>
              </li>
              <li data-trigger="Top" className="menu-item laser-field-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Top</span>
                </button>
              </li>
              <li data-trigger="Bottom" className="menu-item laser-field-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Bottom</span>
                </button>
              </li>
              <li data-trigger="Left" className="menu-item laser-field-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Left</span>
                </button>
              </li>
              <li data-trigger="Right" className="menu-item laser-field-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Right</span>
                </button>
              </li>
            </ul>
          </li>

          {/**/}
          <li id="fizzler-state" className="menu-item hasItem fizzler">
            <a href="#" className="menu-btn">
              <input type="checkbox" defaultChecked id="fizzler-state-input" />
              <span className="menu-text">State</span>
            </a>
          </li>
          <li className="menu-item menu-item-submenu hasItem fizzler" id="fizzler-trigger" data-trigger="Middle Vertical">
            <button type="button" className="menu-btn">
              <i className="fa fa-crosshairs"></i>
              <span className="menu-text title">Middle Horizontal</span>
            </button>
            <ul className="menu">
              <li data-trigger="Middle Horizontal" className="menu-item fizzler-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Middle Horizontal</span>
                </button>
              </li>
              <li data-trigger="Middle Vertical" className="menu-item fizzler-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Middle Vertical</span>
                </button>
              </li>
              <li data-trigger="Top" className="menu-item fizzler-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Top</span>
                </button>
              </li>
              <li data-trigger="Bottom" className="menu-item fizzler-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Bottom</span>
                </button>
              </li>
              <li data-trigger="Left" className="menu-item fizzler-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Left</span>
                </button>
              </li>
              <li data-trigger="Right" className="menu-item fizzler-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-crosshairs"></i>
                  <span className="menu-text">Right</span>
                </button>
              </li>
            </ul>
          </li>

          {/**/}
          <li id="tractor-state" className="menu-item hasItem tractor">
            <a href="#" className="menu-btn">
              <input type="checkbox" defaultChecked id="tractor-state-input" />
              <span className="menu-text">State</span>
            </a>
          </li>
          <li id="tractor-direction" className="menu-item hasItem tractor">
            <a href="#" className="menu-btn">
              <input type="checkbox" id="tractor-direction-input" />
              <span className="menu-text">Revert</span>
            </a>
          </li>
          <li className="menu-item menu-item-submenu hasItem tractor" id="tractor-trigger" data-trigger="State">
            <button type="button" className="menu-btn">
              <i className="fa fa-plug"></i>
              <span className="menu-text title">Triggers: State</span>
            </button>
            <ul className="menu">
              <li data-trigger="State" className="menu-item tractor-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-plug"></i>
                  <span className="menu-text">State</span>
                </button>
              </li>
              <li data-trigger="Direction" className="menu-item tractor-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-plug"></i>
                  <span className="menu-text">Direction</span>
                </button>
              </li>
              <li data-trigger="Both" className="menu-item tractor-triggers">
                <button type="button" className="menu-btn">
                  <i className="fa fa-plug"></i>
                  <span className="menu-text">Both</span>
                </button>
              </li>
            </ul>
          </li>


          <li id="dispenser-state" className="menu-item hasItem dispenser">
            <a href="#" className="menu-btn">
              <input type="checkbox" defaultChecked id="dispenser-opened" />
              <span className="menu-text">Start Opened</span>
            </a>
          </li>

          {/*TRIGGER STATES*/}
          <li id="trigger-visibility" className="menu-item hasItem trigger">
            <a href="#" className="menu-btn">
              <input type="checkbox" defaultChecked id="state-trigger-visibility" />
              <span className="menu-text">Visible</span>
            </a>
          </li>

          <li id="trigger-multiple" className="menu-item hasItem">
            <a href="#" className="menu-btn">
              <input type="checkbox" id="state-trigger-multiple" />
              <span className="menu-text">Multiple Triggers</span>
            </a>
          </li>

          {/**/}

          <li id="trigger-loop" className="menu-item hasItem trigger_audio">
            <a href="#" className="menu-btn">
              <input type="checkbox" id="state-trigger-loop" />
              <span className="menu-text">Loop (replace ambient sound)</span>
            </a>
          </li>

          <li className="menu-item hasItem trigger_voice trigger_audio pellet_catcher exitDoor soundPlay">
            <a href="#" className="menu-btn">
              <input placeholder="link to audio" type="text" id="state-trigger-voice-link" />
            </a>
          </li>

          <li className="menu-item hasItem trigger_voice trigger_audio pellet_catcher exitDoor soundPlay">
            <a href="#" className="menu-btn">
              <button id="play-trigger-voice">Play/Save Audio</button>
            </a>
          </li>

          {/**/}
          <li className="menu-item hasItem piston_platforms track_platforms">
            <a href="#" className="menu-btn">
              <input style={{ width: "30px" }} name="piston-input" type="number" id="piston-max-height" min="0" defaultValue="0" />
              <label htmlFor="piston-input">Range</label>
            </a>
          </li>
          <li className="menu-item hasItem piston_platforms track_platforms pellet pellet_launcher">
            <a href="#" className="menu-btn">
              <input type="checkbox" id="state-piston" defaultChecked />
              <span className="menu-text">Start Active</span>
            </a>
          </li>
          <li className="menu-item hasItem piston_platforms">
            <a href="#" className="menu-btn">
              <input type="checkbox" id="state-piston-loop" defaultChecked />
              <span className="menu-text">Loop</span>
            </a>
          </li>

          {/**/}
          <li className="menu-item hasItem physics">
            <a href="#" className="menu-btn">
              <input type="number" min="0" max="1" id="friction" step="0.1" />
              <span className="menu-text">Friction</span>
            </a>
          </li>
          <li className="menu-item hasItem physics">
            <a href="#" className="menu-btn">
              <input type="number" min="0" max="1" id="restitution" step="0.1" />
              <span className="menu-text">Restitution</span>
            </a>
          </li>

          <li className="menu-item menu-item-submenu buttons hasItem">
            <button type="button" className="menu-btn">
              <i className="fas fa-plug"></i>
              <span className="menu-text">Connections</span>
            </button>
            <ul className="menu" id="connections"></ul>
          </li>

          <li id="pedestal-inifinity" className="menu-item hasItem pedestal">
            <a href="#" className="menu-btn">
              <input type="checkbox" defaultChecked id="state-pedetsal-infinity" />
              <span className="menu-text">Infinity</span>
            </a>
          </li>
          <li id="pedestal-timer" className="menu-item hasItem pedestal disabled">
            <a href="#" className="menu-btn">
              <input type="number" style={{ width: "30px" }} max="30" min="3" defaultValue="3" id="pedestal-timer-value" />
              <span className="menu-text">Timer</span>
            </a>
          </li>

          {/*ENRGY PELLET */}
          <li id="pellet-inifinity" className="menu-item hasItem pellet">
            <a href="#" className="menu-btn">
              <input type="checkbox" defaultChecked id="state-pellet-infinity" />
              <span className="menu-text">Infinity</span>
            </a>
          </li>
          <li id="pellet-timer" className="menu-item hasItem pellet disabled">
            <a href="#" className="menu-btn">
              <input type="number" style={{ width: "30px" }} max="30" min="3" defaultValue="3" id="pellet-timer-value" />
              <span className="menu-text">Timer</span>
            </a>
          </li>

          {/*FAITH PLATE*/}
          <li id="plate-change-target" className="menu-item hasItem faith_plate">
            <a href="#" className="menu-btn">
              <i className="fa fa-sync"></i>
              <span className="menu-text">Update Target</span>
            </a>
          </li>
          <li id="plate-max-height" className="menu-item hasItem faith_plate">
            <a href="#" className="menu-btn">
              <input type="number" style={{ width: "50px" }} max="100" min="0" defaultValue="2" id="plate-max-height-value" step="1" />
              <span className="menu-text">Max Height</span>
            </a>
          </li>

          {/*ANGLED PANEL*/}
          <li className="menu-item menu-item-submenu angled_panel hasItem" id="angled_panel_option" data-angle="60">
            <button type="button" className="menu-btn">
              <i className="fa fa-pallete"></i>
              <span className="menu-text title">Angle on Start: 60</span>
            </button>
            <ul className="menu">
              <li data-angle="90" data-real="0" className="menu-item angled_panel_option">
                <button type="button" className="menu-btn">
                  <i className="fa fa-pallete"></i>
                  <span className="menu-text">90</span>
                </button>
              </li>
              <li data-angle="60" data-real="30" className="menu-item angled_panel_option">
                <button type="button" className="menu-btn">
                  <i className="fa fa-pallete"></i>
                  <span className="menu-text">60</span>
                </button>
              </li>
              <li data-angle="45" data-real="45" className="menu-item angled_panel_option">
                <button type="button" className="menu-btn">
                  <i className="fa fa-pallete"></i>
                  <span className="menu-text">45</span>
                </button>
              </li>
              <li data-angle="30" data-real="60" className="menu-item angled_panel_option">
                <button type="button" className="menu-btn">
                  <i className="fa fa-pallete"></i>
                  <span className="menu-text">30</span>
                </button>
              </li>
              <li data-angle="0" data-real="90" className="menu-item angled_panel_option">
                <button type="button" className="menu-btn">
                  <i className="fa fa-pallete"></i>
                  <span className="menu-text">0</span>
                </button>
              </li>
            </ul>
          </li>

          <li className="menu-item menu-item-submenu angled_panel hasItem" id="angled_panel_trigger" data-angle="60">
            <button type="button" className="menu-btn">
              <i className="fa fa-pallete"></i>
              <span className="menu-text title">Angle on Trigger: 60</span>
            </button>
            <ul className="menu">
              <li data-angle="90" data-real="0" className="menu-item angled_panel_trigger">
                <button type="button" className="menu-btn">
                  <i className="fa fa-pallete"></i>
                  <span className="menu-text">90</span>
                </button>
              </li>
              <li data-angle="60" data-real="30" className="menu-item angled_panel_trigger">
                <button type="button" className="menu-btn">
                  <i className="fa fa-pallete"></i>
                  <span className="menu-text">60</span>
                </button>
              </li>
              <li data-angle="45" data-real="45" className="menu-item angled_panel_trigger">
                <button type="button" className="menu-btn">
                  <i className="fa fa-pallete"></i>
                  <span className="menu-text">45</span>
                </button>
              </li>
              <li data-angle="30" data-real="60" className="menu-item angled_panel_trigger">
                <button type="button" className="menu-btn">
                  <i className="fa fa-pallete"></i>
                  <span className="menu-text">30</span>
                </button>
              </li>
              <li data-angle="0" data-real="90" className="menu-item angled_panel_trigger">
                <button type="button" className="menu-btn">
                  <i className="fa fa-pallete"></i>
                  <span className="menu-text">0</span>
                </button>
              </li>
            </ul>
          </li>

          {/*GELS*/}
          <li className="menu-separator"></li>
          <li id="add-gel" className="menu-item gel">
            <a href="#" className="menu-btn">
              <span className="menu-text">Add Gel</span>
            </a>
          </li>
          <li id="remove-gel" className="menu-item gel">
            <a href="#" className="menu-btn">
              <span className="menu-text">Remove Gel</span>
            </a>
          </li>
          <li className="menu-item menu-item-submenu gel" id="gel-type" data-gel="blue" data-color="rgb(30,144,255)">
            <button type="button" className="menu-btn">
              <i className="fa fa-pallete"></i>
              <span className="menu-text title">Gel Type: Blue</span>
            </button>
            <ul className="menu">
              <li data-gel="blue" data-color="rgb(30,144,255)" className="menu-item gel-type">
                <button type="button" className="menu-btn">
                  <i className="fa fa-pallete"></i>
                  <span className="menu-text">Blue</span>
                </button>
              </li>
              <li data-gel="orange" data-color="rgb(255,140,0)" className="menu-item gel-type">
                <button type="button" className="menu-btn">
                  <i className="fa fa-pallete"></i>
                  <span className="menu-text">Orange</span>
                </button>
              </li>
              {/*<li data-gel="purple" data-color="rgb(75,0,130)" className="menu-item gel-type">
            <button type="purple" className="menu-btn">
              <i className="fa fa-pallete"></i>
              <span className="menu-text">Purple</span>
            </button>
          </li>*/}
            </ul>
          </li>

          {/*RECHARGER*/}
          {/**<li className="menu-item menu-item-submenu gel_recharger" id="gel_recharger-type" data-gel="blue"
            style={{ display: "none !important" }}>
            <button type="button" className="menu-btn">
              <i className="fa fa-pallete"></i>
              <span className="menu-text title">Gel Type: White</span>
            </button>
            <ul className="menu">
              <li data-gel="white" className="menu-item gel_recharger-type">
                <button type="button" className="menu-btn">
                  <i className="fa fa-pallete"></i>
                  <span className="menu-text">White</span>
                </button>
              </li>
              <li data-gel="blue" className="menu-item gel_recharger-type">
                <button type="button" className="menu-btn">
                  <i className="fa fa-pallete"></i>
                  <span className="menu-text">Blue</span>
                </button>
              </li>
              <li data-gel="orange" className="menu-item gel_recharger-type">
                <button type="button" className="menu-btn">
                  <i className="fa fa-pallete"></i>
                  <span className="menu-text">Orange</span>
                </button>
              </li>
              <li data-gel="purple" className="menu-item gel_recharger-type">
                <button type="button" className="menu-btn">
                  <i className="fa fa-pallete"></i>
                  <span className="menu-text">Purple</span>
                </button>
              </li>
              <li data-gel="clear" className="menu-item gel_recharger-type">
                <button type="button" className="menu-btn">
                  <i className="fa fa-pallete"></i>
                  <span className="menu-text">Clear</span>
                </button>
              </li>
              <li data-gel="reflection" className="menu-item gel_recharger-type">
                <button type="button" className="menu-btn">
                  <i className="fa fa-pallete"></i>
                  <span className="menu-text">Reflection</span>
                </button>
              </li>
            </ul>
          </li> */}


        </ul>

        <div id="blocker">

          <span id="version">version: 0.2.1</span>

          <div id="social" style={{
            width: "auto",
            height: "50px",
            left: "10px",
            bottom: "10px",
            position: "absolute",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}>



            <img style={{ height: "25px" }} alt="image" id="social-youtube" className="social-link" src="./assets/youtube.png" />
            <img alt="image" id="social-discord" className="social-link" src="./assets/discord.png" />
            <img alt="image" id="social-twitter" className="social-link" src="./assets/twitter.webp" />
            <img style={{ filter: "invert(1)" }} alt="image" id="social-github" className="social-link" src="./assets/github.png" />
            <button id='signOut' onClick={signOut}>SignOut</button>

            <img style={{ height: "25px" }} alt="image" id="social-patreon" className="social-link" src="./patreonlogoorange.webp" />
          </div>

          <img alt="image" id="logo" src="./assets/ui/logo2.png" style={{
            position: "absolute",
            width: "50%",
            right: "5vh",
            marginTop: "3vh",
            transition: "all 1s"
          }} />

          <div className="body">
            <span id="settings-menu-title">OPTIONS</span>
            <div className="settings-menu">

              <div id="options-main" className="optionMenu">
                <span className="option" id="option-single">SINGLE PLAYER</span>
                <span className="option" id="option-community">COMMUNITY CHAMBERS</span>
                <span className="option" id="option-about">ABOUT</span>
              </div>

              <div id="options-single" className="option-main optionMenu">
                <span className="option" id="option-single-load">PLAY ALL</span>

                <div id="list-main-chambers" className="option optionMenu">
                  <div data-id="1" data-name="./levels/tutorial_1_by_rafadante" className="custom-chamber custom-chamber1"
                    style={{ backgroundImage: "url(./levels/1.webp)" }}>
                    <span>Chamber 1</span>
                  </div>
                  <div data-id="2" data-name="./levels/tutorial_2_by_rafadante" className="custom-chamber custom-chamber1"
                    style={{ backgroundImage: "url(./levels/2.webp)" }}>
                    <span>Chamber 2</span>
                  </div>
                  <div data-id="3" data-name="./levels/tutorial_3_by_rafadante" className="custom-chamber custom-chamber1"
                    style={{ backgroundImage: "url(./levels/3.webp)" }}>
                    <span>Chamber 3</span>
                  </div>
                  <div data-id="4" data-name="./levels/tutorial_4_by_rafadante" className="custom-chamber custom-chamber1"
                    style={{ backgroundImage: "url(./levels/4.webp)" }}>
                    <span>Chamber 4</span>
                  </div>
                  <div data-id="5" data-name="./levels/tutorial_5_by_rafadante" className="custom-chamber custom-chamber1"
                    style={{ backgroundImage: "url(./levels/5.webp)" }}>
                    <span>Chamber 5</span>
                  </div>
                  <div data-id="6" data-name="./levels/tutorial_6_by_rafadante" className="custom-chamber custom-chamber1"
                    style={{ backgroundImage: "url(./levels/6.webp)" }}>
                    <span>Chamber 6</span>
                  </div>
                  <div data-id="7" data-name="./levels/tutorial_7_by_rafadante" className="custom-chamber custom-chamber1"
                    style={{ backgroundImage: "url(./levels/7.webp)" }}>
                    <span>Chamber 7</span>
                  </div>
                  <div data-id="8" data-name="./levels/tutorial_8_by_rafadante" className="custom-chamber custom-chamber1"
                    style={{ backgroundImage: "url(./levels/8.webp)" }}>
                    <span>Chamber 8</span>
                  </div>
                  <div data-id="9" data-name="./levels/tutorial_9_by_rafadante" className="custom-chamber custom-chamber1"
                    style={{ backgroundImage: "url(./levels/9.webp)" }}>
                    <span>Chamber 9</span>
                  </div>
                  <div data-id="10" data-name="./levels/tutorial_10_by_rafadante" className="custom-chamber custom-chamber1"
                    style={{ backgroundImage: "url(./levels/10.webp)" }}>
                    <span>Chamber 10</span>
                  </div>
                </div>
              </div>

              <div id="options-community" className="option-main optionMenu">
                <span className="option main-option" id="option-community-play">PLAY COMMUNITY CHAMBERS</span>
                {/** */}
                <span className="option main-option" id="option-community-build">BUILD TEST CHAMBER</span>

                <div id="list-custm-chambers" className="option sub-option optionMenu">
                  <div id="options-custom">
                    <span data-value="all" id="option-cutom-all">NEW</span>
                    {/**<span data-value="most-played" id="option-cutom-popular">MOST PLAYED</span>
                    <span data-value="most-finished" id="option-cutom-popular">MOST FINISHED</span> */}
                    <span data-value="new" id="option-cutom-new">NOT TESTED</span>
                    <span data-value="played" id="option-cutom-played">UNFINISHED</span>
                    <span data-value="finished" id="option-cutom-finished">FINISHED</span>
                    <span data-value="mine" id="option-cutom-mine">MY CHAMBERS</span>
                  </div>
                  {/**<div data-name="./community/The_Return_Chamber_17_by_FlameDogo99" className="custom-chamber"
                    style={{ backgroundImage: "url(./community/1.webp)" }}>
                    <i className="fas fa-thumbs-up"></i>
                    <i className="fas fa-thumbs-down"></i>
                    <span>The Return Chamber 17 by FlameDogo99</span>
                  </div>

                  <div data-name="./community/Cold_Boot_Chamber_6_by_FlamedDogo99" className="custom-chamber"
                    style={{ backgroundImage: "url(./community/2.webp)" }}>
                    <i className="fas fa-thumbs-up"></i>
                    <i className="fas fa-thumbs-down"></i>
                    <span>Cold Boot Chamber 6 by FlamedDogo99</span>
                  </div>

                  <div data-name="./community/Cold_Boot_Chamber_8_by_FlamedDogo99" className="custom-chamber"
                    style={{ backgroundImage: "url(./community/3.webp)" }}>
                    <i className="fas fa-thumbs-up"></i>
                    <i className="fas fa-thumbs-down"></i>
                    <span>Cold Boot Chamber 8 by FlamedDogo99</span>
                  </div>

                  <div data-name="./community/The_Fall_Chamber_1_by_FlamedDogo99" className="custom-chamber"
                    style={{ backgroundImage: "url(./community/4.webp)" }}>
                    <i className="fas fa-thumbs-up"></i>
                    <i className="fas fa-thumbs-down"></i>
                    <span>The Fall Chamber 1 by FlamedDogo99</span>
                  </div>

                  <div data-name="./community/The_Courtesy_Call_Chamber_5_by_FlamedDogo99" className="custom-chamber"
                    style={{ backgroundImage: "url(./community/5.webp)" }}>
                    <i className="fas fa-thumbs-up"></i>
                    <i className="fas fa-thumbs-down"></i>
                    <span>The Courtesy Call Chamber 5 by FlamedDogo99</span>
                  </div>

                  <div data-name="./community/Triple_Laser_by_FlameDogo99" className="custom-chamber"
                    style={{ backgroundImage: "url(./community/6.webp)" }}>
                    <i className="fas fa-thumbs-up"></i>
                    <i className="fas fa-thumbs-down"></i>
                    <span>Triple Laser by FlameDogo99</span>
                  </div>

                  <div data-name="./community/The_Courtesy_Call_Chamber_6_by_FlamedDogo99" className="custom-chamber"
                    style={{ backgroundImage: "url(./community/7.webp)" }}>
                    <i className="fas fa-thumbs-up"></i>
                    <i className="fas fa-thumbs-down"></i>
                    <span>The Courtesy Call Chamber 6 by FlamedDogo99</span>
                  </div>

                  <div data-name="./community/Igrium's_Intruder_by_FlamedDogo99" className="custom-chamber"
                    style={{ backgroundImage: "url(./community/8.webp)" }}>
                    <i className="fas fa-thumbs-up"></i>
                    <i className="fas fa-thumbs-down"></i>
                    <span>Igrium's Intruder by FlamedDogo99</span>
                  </div>

                  <div data-name="./community/Arisen's_Paradigm_by_FlamedDogo99" className="custom-chamber"
                    style={{ backgroundImage: "url(./community/9.webp)" }}>
                    <i className="fas fa-thumbs-up"></i>
                    <i className="fas fa-thumbs-down"></i>
                    <span>Arisen's Paradigm by FlamedDogo99</span>
                  </div>

                  <div data-name="./community/Excursion_Funnels_by_moon_light" className="custom-chamber"
                    style={{ backgroundImage: "url(./community/10.webp)" }}>
                    <i className="fas fa-thumbs-up"></i>
                    <i className="fas fa-thumbs-down"></i>
                    <span>Excursion Funnels by moon light</span>
                  </div>

                  <div data-name="./community/Test_Chamber_18_by_Arcadius" className="custom-chamber"
                    style={{ backgroundImage: "url(./community/11.webp)" }}>
                    <i className="fas fa-thumbs-up"></i>
                    <i className="fas fa-thumbs-down"></i>
                    <span>Test Chamber 18 by Arcadius</span>
                  </div>

                  <div data-name="./community/Fall_pit_by_Matthew" className="custom-chamber"
                    style={{ backgroundImage: "url(./community/12.webp)" }}>
                    <i className="fas fa-thumbs-up"></i>
                    <i className="fas fa-thumbs-down"></i>
                    <span>Fall pit by Matthew</span>
                  </div> */}

                </div>

              </div>

              <div id="options-about" className="option-main">
                <section>
                  <span>
                    Project Portal Three is a fan-made clone of the portal games made by VALVE, I do not
                    own the original design work and it is only intended htmlFor education under "Fair Use"
                    defined in Section 107 of the Copyright Act (1976).
                    <br></br>
                    With this web version players can instantaneously teleport to new locations via portals that
                    they can shoot onto surfaces. Players can explore their environment while enjoying the novelty
                    of teleportation and interesting physical interactions. Project Portal Three leverages the Three.js and
                    Cannon.js libraries to deliver a comprehensive, visually appealing, and fun demo of the Portal
                    games.
                  </span>
                </section>
              </div>

              <div id="options-patreon" className="option-main">
                <section>
                  <span>
                    Do you want to help with the development of this project? My goal htmlFor this project is to create
                    a web version with Three.js of the portal and portal 2 games made by VALVE, the content presented
                    in this demo was made in X days, I intend to add more content, I will leave the list of
                    things that are still pending, if you want to support this project, you can contribute on
                    Patreon:
                    <br></br>
                    <a href="https://www.patreon.com/rafaelluizleitedesal" target="_blank">link to patreon</a>
                    <br></br>
                    ROADMAP:
                    <br></br>
                    1 - VR version with WebXR
                    <br></br>
                    2 - Create and maintain a server so players can create, save and share their levels with the community
                    <br></br>
                    3 - Create a campaing with all the items with a story inspired by the
                    portal games but with it's own turn of events.
                    <br></br>
                    4 - Test Chamber: Gun animations
                    <br></br>
                    5 - Test Chamber: Improve Graphics
                    <br></br>
                    6 - Test Chamber: Improve Performance
                    <br></br>
                    7 - Test Chamber: Improve Physics
                    <br></br>
                    8 - Test Chamber: Sound effects and music
                    <br></br>
                    9 - Editor: Sound Effects
                    <br></br>
                    10 - Editor: Add more items options:
                    <br></br>
                    10.1 - Tractor Beam: Whenever the player walks through a Tractor Beam they will float through the beam it
                    emits. The blue beam pushes the player forward, away from the receptacle, and the orange beam pulls the
                    player in towards it. The properties menu allows you to start the beam in reversed mode or completely off.
                    <br></br>
                    10.2 - Faith Plate: If a player walks onto a Faith Plate it will cause them to get bounced into the air.
                    When you place a Faith Plate within the editor it will also create a bullseye and a yellow ball. The
                    Bullseye is where the player will ultimately land, and the yellow ball is the trajectory the player will
                    travel.
                    <br></br>
                    10.3 - Light Bridges: Players and objects will not pass through the surface of Light Bridges. Within the
                    properties menu you're given the option to start the bridge enabled or disabled.
                    <br></br>
                    10.4 - Fizzlers: destroy any objects which pass through them such as cubes or turrets. If a player walks
                    through a Fizzler any previously placed portals will also be destroyed. You can increase and decrease the
                    size of the Fizzler using the arrows that appear when the object is selected.
                    <br></br>
                    10.5 - Glass: Glass panels can be placed in your level which the player cannot break. You can increase and
                    decrease the size of the panel by using the arrows that appear when the object is selected. You can change
                    the barrier type to grating within the properties menu which will allow players to place a portal on the
                    other side.
                    <br></br>
                    10.6 - Piston Platforms: Piston Platforms will move up and down whenever the player stands on it. If it is
                    connected to a trigger then the trigger must be activated before it will begin to move. You can adjust the
                    height of the platform using the arrows that appear when the object is selected.
                    <br></br>
                    10.7 - Track Platforms : Track Platforms move on rails. You can adjust the pathing using the arrows that
                    appear when the object is selected. The properties menu allow you to set the rail to oscillate and you can
                    set the platform to start active or disabled.
                    <br></br>
                    10.8 - Laser Emitters & Catchers: are designed to go together. Once the laser emitter hits the catcher you
                    can have it trigger a function such as opening a door, or enabling a set of stairs.
                    <br></br>
                    10.9 - Laser Relays: are used in conjunction with a Laser Catcher. You can connect a relay to a catcher
                    which will result in the player needing to activate both objects before the trigger will work.
                    <br></br>
                    10.10 - Angled Panel : You can adjust the surface type of an Angled Panel through the properties menu. You
                    can make the surface so it allows portals, or you can change it to glass. You can also choose if you want
                    the panel to be automatically deployed or not.
                    <br></br>
                    10.11 - Flip Panels: Flip Panels must be connected to a trigger. Once you have activated the trigger the
                    panel will flip around revealing a surface capable of allowing Portals.
                    <br></br>
                    10.12 - Turrets: will attack the player on sight if they run within their field of vision. You can adjust
                    the field of vision by moving the cone when the object is selected.
                    <br></br>
                    10.13 - Deadly Goo: If the player steps in Deadly Goo they will be instantly killed.
                    <br></br>
                    10.14 - Light Strips: are purely cosmetic and provide your map with additional light. You can place four
                    of
                    them on a single square and they can be placed horizontally or vertically.
                    <br></br>
                    10.15 - Gels: There are four types of Gels. Blue will cause the player to bounce, orange will give the
                    player increased speed, white will allow the player to create a portal on any surface and clear will
                    remove any existing gels from a surface. Whenever Gel is placed a dropper will come with it which will
                    steadily drop gel from its dispenser. The properties menu allows you to change the flow, and you can
                    disable the dropper if you'd like.
                  </span>
                </section>
              </div>

              <div id="options-settings" className="option-main">
                <span className="option selected settings-controls" id="settings-controls">CONTROLS</span>
                <span className="option settings-video" id="settings-video">GRAPHICS</span>
                <span className="option settings-audio" id="settings-audio">AUDIO</span>
                <span className="option" id="settings-language">LANGUAGE</span>
                {/*<span className="option" id="reset-check-point">RESET TO CHECKPOINT</span>*/}
                <span className="option" id="back-editor">BACK TO EDITOR</span>
              </div>

              <div id="options-audio">
                {/*VOLUME*/}
                <div className="options-row">
                  <span className="option-name" id="">VOLUME</span>
                  <div className="option-value">
                    <input step="0.1" id="vol-val-range" type="range" min="0" max="1" defaultValue="0.5" />
                    <input step="0.1" id="vol-val-number" type="number" min="0" max="1" defaultValue="0.5" />
                  </div>
                </div>
              </div>

              <div id="options-controls">
                {/*CAMERA SENSIVITY*/}
                <div className="options-row">
                  <span className="option-name" id="">Camera Rotation Speed</span>
                  <div className="option-value">
                    <input step="0.1" id="mouse-val-range" type="range" min="0.2" max="1" defaultValue="0.5" />
                    <input step="0.1" id="mouse-val-number" type="number" min="0.2" max="1" defaultValue="0.5" />
                  </div>
                </div>
                {/*CAMERA FOV*/}
                <div className="options-row">
                  <span className="option-name" id="">Field ov View</span>
                  <div className="option-value">
                    <input id="fov-val-range" type="range" min="45" max="90" defaultValue="60" />
                    <input id="fov-val-number" type="number" min="45" max="90" defaultValue="60" />
                  </div>
                </div>
                {/*RESET*/}
                <div className="options-row">
                  <button id="reset-control">RESET CONTROL SETTINGS</button>
                </div>

                {/*CAMERA FOV*/}
                <div className="options-row mobile">
                  <span className="option-name" id="">Button Opacity</span>
                  <div className="option-value">
                    <input id="opacity-val-range" type="range" min="0.1" max="1" defaultValue="0.8" step="0.1" />
                    <input id="opacity-val-number" min="0.1" max="1" defaultValue="0.8" type="number" />
                  </div>
                </div>
                {/*GYRO*/}
                <div className="options-row mobile">
                  <span className="option-name" id="">Gyro</span>
                  <div className="option-value">
                    <input id="gyro-input" type="checkbox" />
                  </div>
                </div>
              </div>

              <div id="options-video">
                {/*QUALITY*/}
                <div className="options-row">
                  <span className="option-name" id="">Quality</span>
                  <div className="option-value">
                    <select name="quality" id="quality-select">
                      {/*<option value="potato">Potato</option>*/}
                      <option className="optionQuality" value="very_low">Very Low</option>
                      <option className="optionQuality" value="low">Low</option>
                      <option className="optionQuality" value="medium">Medium</option>
                      <option className="optionQuality desktop" value="high">High</option>
                      <option className="optionQuality desktop" value="epic">Epic</option>
                    </select>
                  </div>
                </div>
                {/*PORTAL RECURSION*/}
                <div className="options-row">
                  <span className="option-name" id="">Recursive Portals</span>
                  <div className="option-value">
                    <select name="recursive" id="recursive-select">
                      {/*<option value="0">0</option>
                  <option value="1">1</option>*/}
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                    </select>
                  </div>
                </div>
                {/*PORTAL RECURSION RENDER*/}
                <div className="options-row">
                  <span className="option-name" id="">Recursive Portals Render</span>
                  <div className="option-value">
                    <select name="recursive" id="recursive-render-select">
                      <option value="0">1</option>
                      <option value="1">2</option>
                      <option value="2">3</option>
                      <option value="100">all</option>
                    </select>
                  </div>
                </div>
                {/*RESOLUTION*/}
                <div className="options-row">
                  <span className="option-name" id="">Resolution</span>
                  <div className="option-value">
                    <select name="resolution" id="resolution-select">
                      <option value="1">1x</option>
                      <option value="0.9">0.9x</option>
                      <option value="0.8">0.8x</option>
                      <option value="0.7">0.7x</option>
                      <option value="0.6">0.6x</option>
                      <option value="0.5">0.5x</option>
                      <option value="0.4">0.4x</option>
                      <option value="0.3">0.3x</option>
                      <option value="0.2">0.2x</option>
                      <option value="0.1">0.1x</option>
                    </select>
                  </div>
                </div>
                {/*SHADOW RESOLUTIONS*/}
                <div className="options-row">
                  <span className="option-name" id="">Shadows Resolution</span>
                  <div className="option-value">
                    <select name="shadows-resolution" id="shadows-resolution-select">
                      <option value="256">256</option>
                      <option value="512">512</option>
                      <option value="1024">1024</option>
                      <option value="2048">2048</option>
                      <option value="4096">4096</option>
                    </select>
                  </div>
                </div>
                {/*PLAYER*/}
                <div className="options-row">
                  <span className="option-name" id="">Player</span>
                  <div className="option-value">
                    <input id="option-player" type="checkbox" />
                  </div>
                </div>
                {/*STATS*/}
                <div className="options-row">
                  <span className="option-name" id="">Stats</span>
                  <div className="option-value">
                    <input id="option-stats" defaultChecked type="checkbox" />
                  </div>
                </div>
                {/*GOO REFLECTIONS*/}
                <div className="options-row">
                  <span className="option-name" id="">Goo Reflections</span>
                  <div className="option-value">
                    <input id="option-goo-reflections" type="checkbox" defaultChecked />
                  </div>
                </div>
                {/*DEBUG*/}
                <div className="options-row">
                  <span className="option-name" id="">Debug Collisions</span>
                  <div className="option-value">
                    <input id="debug-input" type="checkbox" />
                  </div>
                </div>
                {/*PORTAL GUN PROPERTIES*/}
                <div className="options-row">
                  <span className="option-name" id="">Portal gun Color</span>
                  <div className="option-value">
                    <input id="portal-gun-color" type="color" />
                  </div>
                </div>
                <div className="options-row">
                  <span className="option-name" id="">Portal gun Roughness</span>
                  <div className="option-value">
                    <input id="portal-gun-roughness" defaultValue="1" type="number" min="0" max="1" step="0.1"
                      style={{ pointerEvents: "all !important" }} />
                  </div>
                </div>
                <div className="options-row">
                  <span className="option-name" id="">Portal gun Metalness</span>
                  <div className="option-value">
                    <input id="portal-gun-metalness" defaultValue="0" type="number" min="0" max="1" step="0.1"
                      style={{ pointerEvents: "all !important" }} />
                  </div>
                </div>
                {/*FAITH PLATE LINE*/}
                <div className="options-row">
                  <span className="option-name" id="">Faith Plate Trajectory</span>
                  <div className="option-value">
                    <input id="faith-plate-line" type="checkbox" />
                  </div>
                </div>
              </div>
            </div>
            <div id="settings-menu">
              <button id="settings-close">PLAY</button>
              <button id="done">OPTIONS</button>
              <button id="back-main">BACK</button>
            </div>
          </div>
        </div>

        <div id="warning">
          <span>You can not spawn more cubes on this direction</span>
        </div>

        <img alt="image" src="../assets/ui/items/button.png" id="follow" />

        <div id="mobile-controls">

          <button id="close">
            <img alt="image" src="./assets/ui/mobile/pause.png" />
          </button>

          <div id="mobileInterface" className="noSelect">
            <div id="joystickWrapper1"></div>
            {/*<div id="joystickWrapper2"></div>*/}
          </div>

          <img alt="image" style={{
            position: "absolute",
            bottom: "115px",
            right: "70px",
            width: "25vh",
            zIndex: "2",
            filter: "drop-shadow(2px 4px 6px black)",
            opacity: "0.8"
          }} id="portal_l" src="./assets/ui/mobile/portalBlue2.png" />

          <button id="item" style={{
            position: "absolute",
            bottom: "30px",
            right: "65px",
            top: "auto",
            margin: "0px",
            width: "20vh",
            height: "20vh",
            background: "#50d7d2"
          }}>
            <img alt="image" src="./assets/ui/mobile/item.png" />
          </button>

          <button id="jump" style={{
            position: "absolute",
            bottom: "7px",
            right: "155px",
            top: "auto",
            margin: "0px",
            width: "13vh",
            height: "13vh",
            background: "#ef132b"
          }}>
            <img alt="image" src="./assets/ui/mobile/jump.png" />
          </button>

          <button id="crouch" style={{
            position: "absolute",
            bottom: "75px",
            right: "160px",
            top: "auto",
            margin: "0px",
            width: "11vh",
            height: "11vh",
            background: "grey"
          }}>
            <img alt="image" src="./assets/ui/mobile/arrow.png" />
          </button>

          <img alt="image" style={{
            position: "absolute",
            bottom: "55px",
            right: "-20px",
            width: "25vh",
            zIndex: "2",
            transform: "rotate(88deg)",
            filter: "drop-shadow(2px 4px 6px black)",
            opacity: "0.8"
          }} id="portal_r" src="./assets/ui/mobile/portalOrange2.png" />
          <div id="camera2"></div>
        </div>

        <div id="death-screen" style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          left: "0px",
          top: "0px",
          backgroundColor: "rgb(111, 55, 0)",
          zIndex: "100000",
          transition: "all 0.2s",
          pointerEvents: "none",
          opacity: "0"
        }}>

        </div>

        <span id="drawcalls" style={{
          position: "absolute", display: "none",
          bottom: "0px",
          left: "0px",
          zIndex: "109000",
          width: "100px",
          height: "50px",
          background: "black",
          justifyContent: "center",
          alignItems: "center"
        }}></span>

        <div id="panel-top"></div>

        <span id="warning-game" style={{
          position: "absolute",
          background: "white",
          color: "black",
          width: "auto",
          top: "10px",
          left: "40%",
          zIndex: "1000",
          fontSize: "16px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: "50px",
          filter: "drop-shadow(2px 4px 6px black)",
          fontWeight: "bolder",
          padding: "10px",
          opacity: "0",
          pointerEvents: "none",
          transition: "all 0.5s",
        }}>Left Mouse Spawn Orange Portal</span>

        <div id="next-map">

          <div className="content">
            <div className="mainInfo">
              <h1 id="test-name">Name of the chamber</h1>
              <span id="test-author">author name</span>
              <div className="aboutMe">
                <h3 id="test-description">Description</h3>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean fringilla felis non tellus faucibus tempor.
                Maecenas mollis pellentesque nisl, nec tincidunt sem placerat ut. Aliquam vel consectetur augue. Suspendisse
                efficitur faucibus ipsum, in laoreet eros tincidunt ac. Pellentesque interdum nisl eget erat pulvinar.
              </div>
            </div>

            <div className="clearFix"></div>

            <div className="col">
              <h2>Time</h2>
              <div className="resizing">
                <span id="test-time">?</span>
              </div>
            </div>
            <div className="col middle">
              <h2>Portals Used</h2>
              <div className="resizing">
                <span id="test-portals">?</span>
              </div>
            </div>
            <div className="col">
              <h2>Steps</h2>
              <div className="resizing">
                <span id="test-steps">?</span>
              </div>
            </div>
          </div>

          <div id="next-buttons">
            <button id="replay-map-btn">REPLAY</button>
            <button id="back-main-map-btn">BACK TO MAIN MENU</button>
            <button id="next-map-btn">NEXT</button>
          </div>
          {/*<span id="congrats">Thanks For Playing!</span>*/}
        </div>

        <div id="tut" style={{
          background: "black",
          width: "100%",
          height: "100%",
          display: "none",
          zIndex: "100000000",
          position: "absolute",
          top: "0px",
          left: "0px",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}>
          <span className="tut2">
            1: This demo is not optimized and may not run well on some devices.
          </span>
          <span className="tut2">
            2: if you make graphical changes on the settings you may need to reload the page, there are some presets to
            choose.
          </span>
          <span className="tut2">
            3: There are a total of 8 chambers in this demo, your progress will be saved after completing each chamber.
          </span>
          <span className="tut2">
            4: The mobile version works only on landscape mode, also, there is camera bug if you cross a portal while rotating
            the câmera.
          </span>
        </div>

        <div id="mobile-warning" style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: "black",
          zIndex: "1000",
          top: "0px",
          display: "none",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <span style={{ fontSize: "30px", textAlign: "center", padding: "20px" }}>Mobile Version only works on landscape
            mode!</span>
        </div>

        <span id="chamberName" style={{ pointerEvents: "none" }}></span>

        <div id="initial-warning">
          <button id="close-warning">X</button>
          <span>
            This project is currently in beta state, join the discord server to help with feedback.
            <br></br>
            For a stable experience please play the official games, they are amazing:
            <br></br>
            <a href="https://store.steampowered.com/app/400/Portal/?l=portuguese" target="_blank">Portal</a>
            <br></br>
            <a href="https://store.steampowered.com/app/620/Portal_2/?l=portuguese" target="_blank">Portal 2</a>
            <br></br>
            Project Portal THREEJS is a fan-made clone of the portal games made by VALVE in the web browser, I do not
            own the original design work and it is only intended htmlFor education under "Fair Use"
            defined in Section 107 of the Copyright Act (1976).
          </span>
        </div>
      </div>

    );
  }
}

export default App;

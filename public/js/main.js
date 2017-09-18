$(document).ready(() => {

  // Get req for topology object from db and run in Vis.js
  $('.load-topology').on('click', (e) => {

    // Window animation
    $('#mynetwork').css('opacity', 1);

    // Get request to node.js
    $target = $(e.target);
    let id = $target.attr('data-id');
    $.get('/topology/'+id+'/db', (res) => {

      // Set up Vis.js with nodes and edges
      let myNodes = [];
      for(let i in res.hosts){
        let label = res.hosts[i].hostname +'\n'+ res.hosts[i].ip +'\n'+ res.hosts[i].mac +'\n'+ res.hosts[i].vendor;
        myNodes.unshift({id: i, label: label});
      }
      myNodes.unshift({id: 'localhost', label: res.localhost.hostname +'\n'+ res.localhost.ip});
      let nodes = new vis.DataSet(myNodes);

      let myEdges = [];
      for(let i in myNodes){
        if(i<myNodes.length-1){
          myEdges.push({from: myNodes[i].id, to: myNodes[myNodes.length-1].id});
        }
      }
      let edges = new vis.DataSet(myEdges);

      let container = document.getElementById('mynetwork');
      let data = {
        nodes: nodes,
        edges: edges
      };
      let options = {
        nodes: {
          shape: 'box',
          font: {
            align: 'left'
          }
        },
        physics: {
          enabled: false
        }
      };

      // Run Vis.js
      let network = new vis.Network(container, data, options);
    }, 'json');
  });

  // Post edited topology obj to db
  $('.submit-edit').on('click', (e) => {
    $target = $(e.target);
    let id = $target.attr('data-id');

    let serial = $('.edit-form').serializeArray();
    let scan = {
      'scanDate': '',
      'scanAuthor': '',
      'scanTitle': '',
      'localhost': {},
      'hosts': {}
    };

    $.map(serial, (el, index) => {

      let splitEl = el.name.split('-');
      let hostnum = Number(splitEl[0]);
      let portnum = Number(splitEl[2]);

      switch(splitEl[0]){
        case 'scanAuthor': scan.scanAuthor = el.value;
        break;
        case 'scanTitle': scan.scanTitle = el.value;
        break;
        case 'scanDate': scan.scanDate = el.value;
        break;
        case 'localhost':
        switch(splitEl[1]){
          case 'ip': scan.localhost.ip = el.value;
          break;
          case 'hostname': scan.localhost.hostname = el.value;
          break;
        };
        break;
      };

      switch(hostnum){
        case hostnum:
        switch(splitEl[1]){
          case 'hostname': {
            Object.defineProperties(scan.hosts,{
              [hostnum]: {
                writable: true,
                enumerable: true,
                value: {
                  'hostname': el.value
                }
              }
            });
          };
          break;
          case 'ip': scan.hosts[hostnum].ip = el.value;
          break;
          case 'mac': scan.hosts[hostnum].mac = el.value;
          break;
          case 'vendor': scan.hosts[hostnum].vendor = el.value;
          break;
        };
        break;
      };

      if(splitEl[2] && !scan.hosts[hostnum].hasOwnProperty('ports')){
        scan.hosts[hostnum].ports = {};
      }

      if(splitEl[2] && !scan.hosts[hostnum].ports.hasOwnProperty(portnum)){
        scan.hosts[hostnum].ports[portnum] = {};
        switch(splitEl[1]){
          case 'port': scan.hosts[hostnum].ports[portnum].portNum = el.value;
          break;
          case 'service': scan.hosts[hostnum].ports[portnum].service = el.value;
          break;
        };
      } else if(splitEl[2]){
        switch(splitEl[1]){
          case 'port': scan.hosts[hostnum].ports[portnum].portNum = el.value;
          break;
          case 'service': scan.hosts[hostnum].ports[portnum].service = el.value;
          break;
        };
      }
    });

    $.ajax({
      type: 'POST',
      url: '/topology/edit/'+id,
      data: scan
    });
  });

  // Delete req
  $('.delete-topology').on('click', (e) => {
    $target = $(e.target);
    let id = $target.attr('data-id');
    $.ajax({
      type: 'DELETE',
      url: '/topology/'+id,
      success: (response) => {
        alert('Usunięto topologię.');
        window.location.href='/';
      },
      error: (err) => {
        console.log(err);
      }
    });
  });
});

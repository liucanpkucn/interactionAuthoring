
function resize_transform(transform_rule, resize = 1){
  transform_rule['origin'][0] *= resize 
  transform_rule['origin'][1] *= resize 

  if (transform_rule['type'] === "simple"){
    transform_rule['x_rate'] /= resize
    transform_rule['y_rate'] /= resize
  }

  else if (transform_rule['type'] === "polar"){
    transform_rule['radius_rate'][0] *= resize
    transform_rule['radius_rate'][1] *= resize
    transform_rule['begin_radius'] *= resize
  }
}

function screen2xy(screen_x, screen_y, transform_rule){
  if (transform_rule['type'] === "simple"){
    let origin = transform_rule['origin']
    let x_rate = transform_rule['x_rate']
    let y_rate = transform_rule['y_rate']
    return {x: transform_rule['x_rate'] * (screen_x - origin[0]), y: transform_rule['y_rate'] * (screen_y - origin[1])}
  }
  else if (transform_rule['type'] === "polar"){
    let origin = transform_rule['origin']
    let begin_phi = transform_rule['begin_phi']
    let begin_radius = transform_rule['begin_radius']
    let radius_rate = transform_rule['radius_rate']
    let phi_rate = transform_rule['phi_rate']

    let radius_value = Math.sqrt(Math.pow((screen_x - origin[0]), 2) + Math.pow((screen_y - origin[1]), 2))

    let phi_value = Math.acos( - (screen_y - origin[1]) / radius_value)

    if (screen_x - origin[0] < 0)
      phi_value = 2 * Math.PI - phi_value
    if (phi_rate[0] == 0){
      y = (phi_value - begin_phi) / phi_rate[1]
    }
    else {
      x = (phi_value - begin_phi) / phi_rate[0]
    }
    if (radius_rate[0] == 0){
      y = (radius_value - begin_radius) / radius_rate[1]
    }
    else {
      x = (radius_value - begin_radius) / radius_rate[0]
    }
    return {"x": x, "y": y}
  }
    
  console.log('Current we can not handle other type of transition JS')

  return 0, 0
}



function xy2screen(x, y, transform_rule){
  if (transform_rule['type'] === "simple"){
    origin = transform_rule['origin']
    x_rate = transform_rule['x_rate']
    y_rate = transform_rule['y_rate']
    return {x: (x / transform_rule['x_rate']) + origin[0], y: (y / transform_rule['y_rate']) + origin[1]}
  }
  else if (transform_rule['type'] === "polar"){
    origin = transform_rule['origin']
    begin_phi = transform_rule['begin_phi']
    begin_radius = transform_rule['begin_radius']
    radius_rate = transform_rule['radius_rate']
    phi_rate = transform_rule['phi_rate']

    phi_value = begin_phi + phi_rate[0] * x + phi_rate[1] * y
    radius_value = begin_radius + radius_rate[0] * x + radius_rate[1] * y

    // console.log('radius_value: ', radius_value)
    // console.log('phi_value: ', phi_value)
    x = radius_value * Math.sin(phi_value) + origin[0]
    y =  - radius_value * Math.cos(phi_value) + origin[1]
    // console.log("x", x, "y", y)
    return {"x": x, "y": y}
  }
  console.log('Current we can not handle other type of transition JS')

  return 0, 0
}

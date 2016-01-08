timing_test(function() {
  at(0, function() {
    assert_styles(
      '.anim',
      [{'left':'100px'},
       {'left':'100px'},
       {'left':'300px'},
       {'left':'300px'}]);
  }, "Autogenerated");
  at(0.4, function() {
    assert_styles(
      '.anim',
      [{'left':'180px'},
       {'left':'180px'},
       {'left':'220px'},
       {'left':'220px'}]);
  }, "Autogenerated");
  at(0.8, function() {
    assert_styles(
      '.anim',
      [{'left':'260px'},
       {'left':'260px'},
       {'left':'140px'},
       {'left':'140px'}]);
  }, "Autogenerated");
  at(1.2000000000000002, function() {
    assert_styles(
      '.anim',
      [{'left':'140px'},
       {'left':'140px'},
       {'left':'260px'},
       {'left':'260px'}]);
  }, "Autogenerated");
  at(1.6, function() {
    assert_styles(
      '.anim',
      [{'left':'220px'},
       {'left':'220px'},
       {'left':'180px'},
       {'left':'180px'}]);
  }, "Autogenerated");
  at(2, function() {
    assert_styles(
      '.anim',
      [{'left':'300px'},
       {'left':'300px'},
       {'left':'100px'},
       {'left':'100px'}]);
  }, "Autogenerated");
  at(2.4, function() {
    assert_styles(
      '.anim',
      [{'left':'300px'},
       {'left':'300px'},
       {'left':'100px'},
       {'left':'100px'}]);
  }, "Autogenerated");
}, "Autogenerated checks.");

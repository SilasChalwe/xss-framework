#include <cassert>
#include <cstdint>
#include <iostream>
#include <random>
#include <string>

extern "C" const char* encode_text(const char* input);
extern "C" const char* encode_attr(const char* input);
extern "C" const char* encode_url(const char* input);
extern "C" int validate_utf8(const char* input);
extern "C" int detect_control_chars(const char* input);

int main() {
  {
    std::string script = encode_text("<script>alert(1)</script>");
    assert(script == "&lt;script&gt;alert(1)&lt;/script&gt;");
  }

  {
    std::string attr = encode_attr("\" onerror=alert(1)");
    assert(attr.find("onerror") != std::string::npos);
    assert(attr.find("&quot;") != std::string::npos);
    assert(attr.find("&#x3D;") != std::string::npos);
  }

  {
    std::string img = encode_text("<img src=x onerror=alert(1)>");
    assert(img == "&lt;img src=x onerror=alert(1)&gt;");
  }

  {
    std::string svg = encode_text("<svg onload=alert(1)>");
    assert(svg == "&lt;svg onload=alert(1)&gt;");
  }

  {
    std::string js_url = encode_url("javascript:alert(1)");
    assert(js_url == "about:invalid#covian-blocked-url");

    std::string data_url = encode_url("data:text/html;base64,AAA=");
    assert(data_url == "about:invalid#covian-blocked-url");

    std::string https_url = encode_url("https://example.com/a b");
    assert(https_url == "https://example.com/a%20b");

    std::string relative = encode_url("/safe/path?q=1");
    assert(relative == "/safe/path?q=1");
  }

  {
    assert(validate_utf8("valid text") == 1);
    const std::string invalid_utf8("\xC3\x28", 2);
    assert(validate_utf8(invalid_utf8.c_str()) == 0);
  }

  {
    assert(detect_control_chars("safe\ntext") == 0);
    const std::string with_control("hello\x01world", 11);
    assert(detect_control_chars(with_control.c_str()) == 1);
  }

  // Adversarial fuzz: ensure text encoding always escapes HTML metacharacters.
  std::mt19937 rng(1337);
  std::uniform_int_distribution<int> len_dist(1, 64);
  std::uniform_int_distribution<int> byte_dist(0, 127);

  for (int i = 0; i < 2000; i += 1) {
    std::string payload;
    payload.reserve(static_cast<std::size_t>(len_dist(rng)));
    const int len = len_dist(rng);
    for (int j = 0; j < len; j += 1) {
      payload.push_back(static_cast<char>(byte_dist(rng)));
    }

    const std::string encoded = encode_text(payload.c_str());
    assert(encoded.find("<") == std::string::npos);
    assert(encoded.find(">") == std::string::npos);
  }

  std::cout << "secure_core adversarial suite passed\n";
  return 0;
}

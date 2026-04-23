#include <cassert>
#include <iostream>

extern "C" const char* secure_transform(const char* raw_data);

int main() {
  const char* out = secure_transform("<script>alert('x')</script>");
  std::string encoded(out);

  assert(encoded == "&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;");
  std::cout << "secure_transform test passed\n";
  return 0;
}

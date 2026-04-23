#include <cstddef>
#include <cstdlib>
#include <cstring>
#include <string>

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#define COVIAN_EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define COVIAN_EXPORT
#endif

namespace covian {

static inline void append_escaped(std::string& out, char ch) {
  switch (ch) {
    case '&': out.append("&amp;"); break;
    case '<': out.append("&lt;"); break;
    case '>': out.append("&gt;"); break;
    case '"': out.append("&quot;"); break;
    case '\'': out.append("&#39;"); break;
    default: out.push_back(ch); break;
  }
}

static std::string encode_html_text(const char* raw_data) {
  if (raw_data == nullptr) {
    return "";
  }

  std::string input(raw_data);
  std::string out;
  out.reserve(input.size() * 2);

  for (char ch : input) {
    append_escaped(out, ch);
  }

  return out;
}

}  // namespace covian

extern "C" {

// Returns a pointer into a function-internal thread-local buffer. The
// returned string is valid only until the next call to secure_transform on the
// same thread. Callers must not store the returned pointer beyond immediate
// use. For stable ownership, use secure_transform_alloc + secure_free instead.
COVIAN_EXPORT const char* secure_transform(const char* raw_data) {
  static thread_local std::string buffer;
  buffer = covian::encode_html_text(raw_data);
  return buffer.c_str();
}

COVIAN_EXPORT char* secure_transform_alloc(const char* raw_data) {
  const std::string encoded = covian::encode_html_text(raw_data);

  char* heap_output = static_cast<char*>(std::malloc(encoded.size() + 1));
  if (heap_output == nullptr) {
    return nullptr;
  }

  std::memcpy(heap_output, encoded.c_str(), encoded.size() + 1);
  return heap_output;
}

COVIAN_EXPORT void secure_free(char* ptr) {
  std::free(ptr);
}

}

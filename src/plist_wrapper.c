#include <stdlib.h>
#include <string.h>
#include <plist/plist.h>

__attribute__((export_name("plist_is_valid")))
int plist_is_valid(const char* data, uint32_t length) {
    if (!data || length == 0) {
        return 0;
    }
    
    plist_t plist = NULL;
    plist_format_t format = PLIST_FORMAT_NONE;
    plist_err_t err = plist_from_memory(data, length, &plist, &format);
    
    if (err != PLIST_ERR_SUCCESS || !plist) {
        return 0;
    }
    
    plist_free(plist);
    return 1;
}

__attribute__((export_name("plist_parse_to_json")))
char* plist_parse_to_json(const char* data, uint32_t length, uint32_t* out_length) {
    if (!data || !out_length || length == 0) {
        return NULL;
    }
    
    plist_t plist = NULL;
    plist_format_t format = PLIST_FORMAT_NONE;
    
    plist_err_t err = plist_from_memory(data, length, &plist, &format);
    
    if (err != PLIST_ERR_SUCCESS || !plist) {
        return NULL;
    }
    
    char* json_data = NULL;
    err = plist_to_json(plist, &json_data, out_length, 0);
    
    plist_free(plist);
    
    if (err != PLIST_ERR_SUCCESS || !json_data) {
        return NULL;
    }
    
    return json_data;
}

__attribute__((export_name("plist_json_to_xml")))
char* plist_json_to_xml(const char* json_data, uint32_t json_length, uint32_t* out_length) {
    if (!json_data || !out_length || json_length == 0) {
        return NULL;
    }
    
    plist_t plist = NULL;
    plist_err_t err = plist_from_json(json_data, json_length, &plist);
    
    if (err != PLIST_ERR_SUCCESS || !plist) {
        return NULL;
    }
    
    char* xml_data = NULL;
    err = plist_to_xml(plist, &xml_data, out_length);
    
    plist_free(plist);
    
    if (err != PLIST_ERR_SUCCESS || !xml_data) {
        return NULL;
    }
    
    return xml_data;
}

__attribute__((export_name("plist_json_to_bin")))
char* plist_json_to_bin(const char* json_data, uint32_t json_length, uint32_t* out_length) {
    if (!json_data || !out_length || json_length == 0) {
        return NULL;
    }
    
    plist_t plist = NULL;
    plist_err_t err = plist_from_json(json_data, json_length, &plist);
    
    if (err != PLIST_ERR_SUCCESS || !plist) {
        return NULL;
    }
    
    char* bin_data = NULL;
    err = plist_to_bin(plist, &bin_data, out_length);
    
    plist_free(plist);
    
    if (err != PLIST_ERR_SUCCESS || !bin_data) {
        return NULL;
    }
    
    return bin_data;
}

__attribute__((export_name("plist_bin_to_xml")))
char* plist_bin_to_xml(const char* bin_data, uint32_t bin_length, uint32_t* out_length) {
    if (!bin_data || !out_length || bin_length == 0) {
        return NULL;
    }
    
    plist_t plist = NULL;
    plist_from_bin(bin_data, bin_length, &plist);
    
    if (!plist) {
        return NULL;
    }
    
    char* xml_data = NULL;
    plist_to_xml(plist, &xml_data, out_length);
    
    plist_free(plist);
    
    if (!xml_data) {
        return NULL;
    }
    
    return xml_data;
}

__attribute__((export_name("plist_xml_to_bin")))
char* plist_xml_to_bin(const char* xml_data, uint32_t xml_length, uint32_t* out_length) {
    if (!xml_data || !out_length || xml_length == 0) {
        return NULL;
    }
    
    plist_t plist = NULL;
    plist_from_xml(xml_data, xml_length, &plist);
    
    if (!plist) {
        return NULL;
    }
    
    char* bin_data = NULL;
    plist_to_bin(plist, &bin_data, out_length);
    
    plist_free(plist);
    
    if (!bin_data) {
        return NULL;
    }
    
    return bin_data;
}

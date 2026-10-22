export const validateStep = async (
  step: number,
  form: any,
  setFormError: any,
): Promise<boolean> => {
  try {
    setFormError(null);
    form.clearErrors();

    if (step === 0) {
      const basicInfo = form.getValues();
      if (!basicInfo.nome || basicInfo.nome.length < 3) {
        form.setError("nome", {
          message: "Nome é obrigatório e deve ter pelo menos 3 caracteres",
        });
        return false;
      }

      if (!basicInfo.nif || !/^\d{9}$/.test(basicInfo.nif)) {
        form.setError("nif", {
          message: "NIF deve ter exatamente 9 dígitos",
        });
        return false;
      }

      if (!basicInfo.natureza_juridica) {
        form.setError("natureza_juridica", {
          message: "Natureza jurídica é obrigatória",
        });
        return false;
      }
      
      // Check if "Outro" is selected for natureza_juridica
      if (basicInfo.natureza_juridica && basicInfo.natureza_juridica.includes("Outro")) {
        // If "Outro" is selected, natureza_juridica_outro is required
        if (!basicInfo.natureza_juridica_outro || basicInfo.natureza_juridica_outro.trim() === "") {
          form.setError("natureza_juridica_outro", {
            message: "Este campo é obrigatório quando 'Outro' é selecionado",
          });
          return false;
        }
      }
    } else if (step === 1) {
      const contactInfo = form.getValues("contato");
      if (!contactInfo.endereco || contactInfo.endereco.trim() === "") {
        form.setError("contato.endereco", {
          message: "Endereço é obrigatório",
        });
        return false;
      }
      if (!contactInfo.telemovel || !/^[95]\d{6}$/.test(contactInfo.telemovel)) {
        form.setError("contato.telemovel", {
          message: "Telemóvel deve começar com 9 ou 5 e ter 7 dígitos",
        });
        return false;
      }
      if (contactInfo.telefone && !/^2\d{6}$/.test(contactInfo.telefone)) {
        form.setError("contato.telefone", {
          message: "Telefone deve começar com 2 e ter 7 dígitos",
        });
        return false;
      }
      if (contactInfo.website && contactInfo.website.trim() !== "") {
        const urlRegex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+)(\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?$/;
        
        if (!urlRegex.test(contactInfo.website)) {
          form.setError("contato.website", {
            message: "Website inválido. Use o formato: www.exemplo.com ou https://exemplo.com",
          });
          return false;
        }
      }

      if (contactInfo.email.trim() !== "" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email)
      ) {
        form.setError("contato.email", { 
          message: "Email inválido" 
        });
        return false;
      }
    } else if (step === 2) {
      const geografiaInfo = form.getValues("geografia");
      
      if (!geografiaInfo.ilha) {
        form.setError("geografia.ilha", { message: "Ilha é obrigatória" });
        return false;
      }
      
      if (!geografiaInfo.concelho) {
        form.setError("geografia.concelho", { message: "Concelho é obrigatório" });
        return false;
      }
      
      if (!geografiaInfo.freguesia) {
        form.setError("geografia.freguesia", { message: "Freguesia é obrigatória" });
        return false;
      }
      
      if (!geografiaInfo.zona) {
        form.setError("geografia.zona", { message: "Localidade é obrigatória" });
        return false;
      }

      if (!geografiaInfo.lugar) {
        form.setError("geografia.lugar", { message: "Zona é obrigatório" });
        return false;
      }
    }

    return true;
  } catch (error: any) {
    setFormError(error.message || "Erro na validação");
    return false;
  }
};
"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface ContactInfoFormProps {
  form: UseFormReturn<any>;
  isEditing?: boolean;
}

export function ContactInfoForm({ form, isEditing }: ContactInfoFormProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="contato.endereco"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Endereço  <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <Input
                placeholder="Endereço completo" 
                {...field}
                className="w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="contato.caixa_postal"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Caixa Postal</FormLabel>
            <FormControl>
              <Input 
                placeholder="Caixa Postal" 
                {...field}
                className="w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="contato.telefone"
          render={({ field }) => (
            <FormItem>
              <FormLabel> Telefone Fixo (de preferência institucional) </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Telefone fixo" 
                  {...field}
                  className="w-full"
                  maxLength={7}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contato.telemovel"
          render={({ field }) => (
            <FormItem>
              <FormLabel> Telemóvel (de preferência institucional) <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input 
                  placeholder="7 dígitos" 
                  {...field}
                  maxLength={7}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="contato.email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>E-mail (de preferência institucional)</FormLabel>
            <FormControl>
              <Input
                readOnly={isEditing}
                disabled={isEditing}
                placeholder="Email" 
                type="email"
                {...field}
                className="w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="contato.website"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Website</FormLabel>
            <FormControl>
              <Input 
                placeholder="Website (opcional)" 
                {...field}
                className="w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      </div>
    </div>
  );
}